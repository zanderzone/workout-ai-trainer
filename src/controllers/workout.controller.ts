import { Request, Response } from "express";
import { Collection } from "mongodb";
import { ContinuationToken, getWorkoutGenerator } from "../services/workout.service";
import { createWorkoutSchema, CreateWorkoutDTO } from "../types/workout.types";

const workoutController = {
    async createWorkout(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body using Zod schema
            const validationResult = createWorkoutSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({ error: validationResult.error.errors });
                return;
            }

            const { userId, workoutId, numberOfWeeks, workoutOptions }: CreateWorkoutDTO = validationResult.data;
            const userCollection: Collection = req.app.locals.usersCollection;
            const workoutsCollection: Collection = req.app.locals.workoutsCollection;
            const workoutResultsCollection: Collection = req.app.locals.workoutResultsCollection;
            const workoutGenerator = getWorkoutGenerator();

            const userProfile = await userCollection.findOne({ userId });
            const pastResults = await workoutResultsCollection
                .find({ userId })
                .sort({ date: -1 })
                .limit(5)
                .toArray();

            if (!workoutId) {
                if (!userId) {
                    res.status(400).json({ error: "User ID is required" });
                    return;
                }

                const results = await workoutGenerator.generateWorkout(userId, userProfile, pastResults, null, workoutOptions, numberOfWeeks);
                await workoutsCollection.insertOne(results);

                res.json({ message: "Workout plan stored successfully", results: results.workoutPlan });
            } else {
                // Fetch the existing workout
                const existingWorkout = await workoutsCollection.findOne({ id: workoutId });
                if (!existingWorkout) {
                    res.status(404).json({ error: "Workout not found" });
                    return;
                }

                let continuationToken: ContinuationToken = {
                    token: workoutId,
                    currentWeek: existingWorkout.workoutPlan.length + 1,
                    missingDays: existingWorkout.continuationToken?.missingDays || [],
                    missingWeeks: existingWorkout.continuationToken?.missingWeeks || [],
                };

                // Generate new week(s) and append to the existing workout
                const results = await workoutGenerator.generateWorkout(userId, userProfile, pastResults, continuationToken, workoutOptions, numberOfWeeks);
                
                if (Array.isArray(results.workoutPlan.workoutPlan)) {
                    existingWorkout.workoutPlan.push(...results.workoutPlan.workoutPlan);
                    existingWorkout.continuationToken = results.continuationToken;
                } else {
                    res.status(500).json({ error: "Invalid workout plan format" });
                    return;
                }

                // Update the workout in the database
                await workoutsCollection.updateOne(
                    { id: workoutId },
                    { $set: { workoutPlan: existingWorkout.workoutPlan, continuationToken: existingWorkout.continuationToken } }
                );

                res.json({ message: "New week(s) added to workout", results: existingWorkout });
            }
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async getWorkout(req: Request, res: Response) {
        // Implement the method to retrieve workouts as needed
    }
};

export default workoutController;