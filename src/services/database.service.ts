import { Application } from "express";
// import knex from "knex";
import { MongoClient, Db, Collection } from "mongodb";
import { workoutResultSchema, WorkoutPlan, workoutPlanDBSchema } from "../types/workout.types";
// import { generateUuid } from "../utils/uuid";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://mongo:27017";

let usersCollection: Collection;
let workoutsCollection: Collection;
let workoutResultsCollection: Collection;
let benchmarkCollection: Collection;

// const db = knex({
//     client: "pg",
//     connection: POSTGRES_URI,
//     pool: { min: 2, max: 10 },
// });

export async function connectDatabases(app: Application) {
    const mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const mongoDb: Db = mongoClient.db("workouts_ai_trainer");
    usersCollection = mongoDb.collection("users");
    benchmarkCollection = mongoDb.collection("benchmark_workouts");
    workoutsCollection = mongoDb.collection("workouts");
    workoutResultsCollection = mongoDb.collection("workout_results");
    workoutResultsCollection.createIndex({ user_id: 1, date: -1 });
 


    app.locals.usersCollection = usersCollection;
    app.locals.benchmarkCollection = benchmarkCollection;
    app.locals.workoutsCollection = workoutsCollection;
    app.locals.workoutResultsCollection = workoutResultsCollection;
    // app.locals.db = db;
}

export async function saveWorkout(workout: WorkoutPlan, workoutId?: string): Promise<void> {
    // Validate the workout plan against the schema
    const validation = workoutPlanDBSchema.safeParse(workout);

    if (!validation.success) {
        throw new Error("Invalid workout JSON structure");
    }

    try {
        if (workoutId) {
            // Update existing workout with a new week
            const existingWorkout = await workoutsCollection.findOne({ workout_id: workoutId });

            if (existingWorkout) {
                // Extract the existing workout plan and append the new week's workout
                const updatedWorkoutPlan = [
                  ...existingWorkout.workoutPlan,
                  ...workout.workoutPlan,
                ];

                // Update the workout in the database
                await workoutsCollection.updateOne(
                    { workout_id: workoutId },
                    { $set: { workout_plan: updatedWorkoutPlan } },
                );
            } else {
                // Handle case where workoutId is provided but no existing workout is found
                throw new Error(`Workout with ID ${workoutId} not found`);
            }
        } else {
            // Insert a new workout into the database
            await workoutsCollection.insertOne(workout);
        }
    } catch (error) {
        // Handle database errors appropriately
        console.error("Error saving workout:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// export async function getWorkout(userId: string) {
    // const result = await db("workouts").where({ user_id: userId }).select("plan").first();
    // return result || null;
// }


export async function saveWorkoutResult(userId: string, workoutId: string, workoutResult: any): Promise<void> {
  const validation = workoutResultSchema.safeParse(workoutResult);
  if (!validation.success) {
    throw new Error("Invalid workout result JSON structure");
  }

  try {
    // Add workout_id and user_id to the workoutResult object
    const workoutResultWithIds = {
    ...workoutResult,
      workout_id: workoutId,
      user_id: userId,
      completed_at: new Date(), // Add completed_at timestamp
    };

    // Insert the workout result into the MongoDB collection
    await workoutResultsCollection.insertOne(workoutResultWithIds);
  } catch (error) {
    // Handle database errors appropriately
    console.error("Error saving workout result:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}