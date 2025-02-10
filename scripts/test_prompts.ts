import { OpenAIWorkoutAdapter } from "../src/services/workout.service";
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { WorkoutResult } from "../src/types/workout.types";
import { WorkoutOptions } from "../src/types/workoutOptions.types";

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

dotenv.config();

async function testGenerateWorkout() {
    const aiAdapter = new OpenAIWorkoutAdapter();
    const mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const mongoDb = mongoClient.db("workouts_ai_trainer");
    const userCollection = mongoDb.collection("users");
    const id = "16dfe456-071e-47c1-b65f-d6072c45842f";

    const userProfile = await userCollection.findOne({ id });
    console.log("User Profile:" + JSON.stringify(userProfile, null, 2));

    let pastResults: WorkoutResult[] = [];

    const workoutOptions: WorkoutOptions = {
        "scaling": "lighter weight or bodyweight exercises",
        "includeScalingOptions": true,
        "workoutPlanDuration": "4 weeks",
        "workoutDuration": "60 minutes",
        "workoutFocus": "Strength & Conditioning",
        "preferredTrainingDays": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ],
        "includeWarmups": true,
        "includeAlternateMovements": true,
        "includeCooldown": true,
        "includeRestDays": true,
        "includeBenchmarkWorkouts": true,
        "periodization": "concurrent"
    };

    // const pastResults = [
        // { workout: "Fran", time: "2:45", scaling: "Rx" },
        // { workout: "Back Squat", weight: "450 lbs", reps: "1" },
        // { workout: "Clean & Jerk", weight: "153 kg", reps: "1" },
        // { workout: "Snatch", weight: "123 kg", reps: "1" }
    // ];

    const continuationToken = null; // Use null initially, test with token later

    try {
        // TODO: Consider including personal bests as a parameter to include in the prompts
        const response = await aiAdapter.generateWorkout("user123", userProfile, pastResults, continuationToken, workoutOptions);

        console.log("Generated Workout Plan:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error in AI Response:", error);
    }
}

testGenerateWorkout();
