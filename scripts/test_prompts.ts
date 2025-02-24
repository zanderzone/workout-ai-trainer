import { OpenAIWorkoutAdapter } from "../src/services/workout.service";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { WorkoutResult } from "../src/types/workout.types";
import { WorkoutOptions } from "../src/types/workoutOptions.types";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function testGenerateWorkout() {
    const aiAdapter = new OpenAIWorkoutAdapter();
    const mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const mongoDb = mongoClient.db("workouts_ai_trainer");
    const userCollection = mongoDb.collection("users");

    // Fetch a user profile from the database (assume the first user in the collection)
    const userProfile = await userCollection.findOne({});
    if (!userProfile) {
        console.error("No user profiles found in the database. Run populate_users.ts first.");
        return;
    }

    console.log("Using User Profile:", JSON.stringify(userProfile, null, 2));

    let pastResults: WorkoutResult[] = [];

    const workoutOptions: WorkoutOptions = {
        "scaling": "lighter weight or bodyweight exercises",
        "includeScalingOptions": true,
        "workoutPlanDuration": "4 weeks",
        "workoutDuration": "60 minutes",
        "workoutFocus": "Strength & Conditioning",
        "preferredTrainingDays": [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ],
        "includeWarmups": true,
        "includeAlternateMovements": true,
        "includeCooldown": true,
        "includeRestDays": true,
        "includeBenchmarkWorkouts": true,
        "periodization": "concurrent"
    };

    const continuationToken = null; // Use null initially, test with token later

    try {
        const response = await aiAdapter.generateWorkout(
            userProfile.userId, // Use OAuth userId from the fetched user
            userProfile,
            pastResults,
            continuationToken,
            workoutOptions
        );

        console.log("Generated Workout Plan:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error in AI Response:", error);
    } finally {
        await mongoClient.close();
    }
}

testGenerateWorkout();
