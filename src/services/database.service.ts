import { Application } from "express";
import knex from "knex";
import { MongoClient, Db, Collection } from "mongodb";
import { workoutResultSchema, workoutResponseSchema } from "../types/workout.types";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://mongo:27017";
const POSTGRES_URI: string = process.env.POSTGRES_URI || "postgres://postgres:secret@postgres/workouts";

let userCollection: Collection;
let benchmarkCollection: Collection;

const db = knex({
    client: "pg",
    connection: POSTGRES_URI,
    pool: { min: 2, max: 10 },
});

export async function connectDatabases(app: Application) {
    const mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const mongoDb: Db = mongoClient.db("crossfit_app");
    userCollection = mongoDb.collection("users");
    benchmarkCollection = mongoDb.collection("benchmark_workouts");
    
    app.locals.userCollection = userCollection;
    app.locals.benchmarkCollection = benchmarkCollection;
    app.locals.db = db;
}

export async function saveWorkout(userId: string, workoutPlan: any) {
    const validation = workoutResponseSchema.safeParse(workoutPlan);
    if (!validation.success) {
        throw new Error("Invalid workout JSON structure");
    }
    return await db.transaction(async trx => {
        await trx("workouts").insert({
            user_id: userId,
            plan: JSON.stringify(workoutPlan),
            created_at: new Date(),
        });
    });
}

export async function getWorkout(userId: string) {
    const result = await db("workouts").where({ user_id: userId }).select("plan").first();
    return result || null;
}

export async function saveWorkoutResult(userId: string, workoutId: string, workoutResult: any) {
    const validation = workoutResultSchema.safeParse(workoutResult);
    if (!validation.success) {
        throw new Error("Invalid workout result JSON structure");
    }
    return await db.transaction(async trx => {
        await trx("workout_results").insert({
            user_id: userId,
            workout_id: workoutId,
            result: JSON.stringify(workoutResult),
            completed_at: new Date(),
        });
    });
}
