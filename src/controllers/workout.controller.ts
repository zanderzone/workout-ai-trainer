import { Request, Response } from "express";
import { Collection } from "mongodb";
import { getWorkoutGenerator } from "../services/workout.service";
import { createWorkoutSchema, CreateWorkoutDTO } from "../types/workout.types";
import { WorkoutResult } from "../types/workout.types";
import { ContinuationToken } from "../types/continuationToken.types";

const workoutController = {
    async createWorkout(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body using Zod schema
            const validationResult = createWorkoutSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({ error: validationResult.error.errors });
                return;
            }

            const { userId, workoutId, numberOfWeeks = 1, workoutOptions }: CreateWorkoutDTO = validationResult.data;
            const userCollection: Collection = req.app.locals.usersCollection;
            const workoutsCollection: Collection = req.app.locals.workoutsCollection;
            const workoutResultsCollection: Collection = req.app.locals.workoutResultsCollection;
            const workoutGenerator = getWorkoutGenerator();

            const userProfile = await userCollection.findOne({ userId });
            const pastResults = await workoutResultsCollection
                .find<WorkoutResult>({ userId })
                .project({ workoutId: 1, userId: 1, date: 1, results: 1, overallFeeling: 1, modality: 1 })
                .sort({ date: -1 })
                .limit(5)
                .toArray() as WorkoutResult[];


            if (!workoutId) {
                if (!userId) {
                    res.status(400).json({ error: "User ID is required" });
                    return;
                }

                const results = await workoutGenerator.generateWorkout(userId, userProfile, pastResults, null, workoutOptions, numberOfWeeks);
                await workoutsCollection.insertOne(results);

                res.json({
                    message: `Workout plan for ${numberOfWeeks} week(s) stored successfully`,
                    results: results.workoutPlan
                });
            } else {
                // Fetch existing workout
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

                // Generate new week(s)
                const results = await workoutGenerator.generateWorkout(userId, userProfile, pastResults, continuationToken, workoutOptions, numberOfWeeks);

                if (Array.isArray(results.workoutPlan.workoutPlan)) {
                    existingWorkout.workoutPlan.push(...results.workoutPlan.workoutPlan);
                    existingWorkout.continuationToken = results.continuationToken;
                } else {
                    res.status(500).json({ error: "Invalid workout plan format" });
                    return;
                }

                // Update in database
                await workoutsCollection.updateOne(
                    { id: workoutId },
                    {
                        $set: {
                            workoutPlan: existingWorkout.workoutPlan,
                            continuationToken: existingWorkout.continuationToken
                        }
                    }
                );

                res.json({ message: `Added ${numberOfWeeks} week(s) to workout`, results: existingWorkout });
            }
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async addNextWeeks(req: Request, res: Response): Promise<void> {
        try {
            const { workoutId } = req.params;
            const { numberOfWeeks, workoutOptions } = req.body;

            if (!workoutId) {
                res.status(400).json({ error: "Workout ID is required" });
                return;
            }

            const workoutsCollection = req.app.locals.workoutsCollection;
            const existingWorkout = await workoutsCollection.findOne({ id: workoutId });

            if (!existingWorkout) {
                res.status(404).json({ error: "Workout not found" });
                return;
            }

            // Get AI generator
            const workoutGenerator = getWorkoutGenerator();

            // Use the continuation token to fetch the next weeks
            const continuationToken = existingWorkout.continuationToken || { token: workoutId, currentWeek: 1 };
            const results = await workoutGenerator.generateWorkout(
                existingWorkout.userId,
                {},
                [],
                continuationToken,
                workoutOptions,
                numberOfWeeks
            );

            if (!results || !results.workoutPlan) {
                res.status(500).json({ error: "Failed to generate next weeks" });
                return;
            }
            // Append new weeks to the existing workout plan
            existingWorkout.workoutPlan = [...existingWorkout.workoutPlan, ...(results.workoutPlan.workoutPlan || [])];
            existingWorkout.continuationToken = results.continuationToken;

            // Update workout in database
            await workoutsCollection.updateOne(
                { id: workoutId },
                { $set: { workoutPlan: existingWorkout.workoutPlan, continuationToken: existingWorkout.continuationToken } }
            );

            res.json({ message: `Added ${numberOfWeeks} week(s) to workout`, results: existingWorkout });
            return;
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    },

    async getWorkout(req: Request, res: Response): Promise<void> {
        try {
            const { workoutId } = req.params;
            if (!workoutId) {
                res.status(400).json({ error: "Workout ID is required" });
                return;
            }

            const workoutsCollection = req.app.locals.workoutsCollection;
            const workout = await workoutsCollection.findOne({ id: workoutId });

            if (!workout) {
                res.status(404).json({ error: "Workout not found" });
                return;
            }

            res.json(workout);
            return;
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
            return;
        }// Implement the method to retrieve workouts as needed
    }
};

export default workoutController;