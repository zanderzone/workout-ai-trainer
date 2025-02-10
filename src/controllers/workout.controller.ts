import { Request, Response } from "express";
import { Collection } from "mongodb";
import { Pool } from "pg";
import OpenAI from "openai";
import { getWorkoutGenerator } from "../services/workout.service";
import { saveWorkout } from "../services/database.service";

const workoutController = {
    async createWorkout(req: Request, res: Response) {
        try {
            const { userId } = req.body;
            const userCollection: Collection = req.app.locals.userCollection;
            const benchmarkCollection: Collection = req.app.locals.benchmarkCollection;
            const pgPool: Pool = req.app.locals.pgPool;
            const openai: OpenAI = req.app.locals.openai;

            const userProfile = await userCollection.findOne({ user_id: userId });
            const pastResults = await pgPool.query("SELECT result FROM workout_results WHERE user_id = $1", [userId]);
            // const benchmarkWorkouts = await benchmarkCollection.find().toArray();

            const workoutGenerator = getWorkoutGenerator();
            const workoutPlan = await workoutGenerator.generateWorkout(userId, userProfile, pastResults.rows);
            await saveWorkout(userId, workoutPlan);
            res.json({ message: "Workout plan stored successfully", workoutPlan });
        } catch (error) {
            console.error("Error generating workout plan:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async getWorkout(req: Request, res: Response) {
        try {
            const pgPool: Pool = req.app.locals.pgPool;
            const { userId } = req.params;
            const result = await pgPool.query("SELECT plan FROM workouts WHERE user_id = $1", [userId]);
            res.json(result.rows.length ? result.rows[0] : { message: "No workout found" });
        } catch (error) {
            console.error("Error fetching workout plan:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export default workoutController;
