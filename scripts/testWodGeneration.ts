import { OpenAIWorkoutAdapter } from "../src/services/wod.service";
import { WorkoutOptions } from "../src/types/workoutOptions.types";
import { UserProfile } from "../src/types/userProfile.types";
import { formatWodToMarkdown } from "../src/utils/markdown";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

console.log('OPENAI_API_KEY is', process.env.OPENAI_API_KEY ? 'set' : 'not set');

// Mock user profile and workout options
const userId = uuidv4();
const userProfile: UserProfile = {
    userId,
    ageRange: "45-54",
    sex: "male",
    fitnessLevel: "beginner",
    goals: ["weight loss", "strength", "athletic conditioning", "endurance", "hypertrophy"],
    injuriesOrLimitations: ["left knee tightness"],
    createdAt: new Date(),
    updatedAt: new Date()
};

const workoutOptions: WorkoutOptions = {
    totalAvailableTime: "60 minutes",
    userDescription: "For today's WOD, I'd like to focus on a workout that helps me improve my ability to complete a WOD with intensity and strength. Please make it fun and challenging",
    workoutDuration: "8 minutes <= duration <= 12 minutes",
    scaling: "shorter duration, shorter distances, lighter weight or bodyweight exercises",
    includeScalingOptions: true,
    includeWarmups: true,
    includeAlternateMovements: true,
    includeCooldown: true,
    includeBenchmarkWorkouts: true,
    availableEquipment: [
        "45 lb olympic barbell", "35 lb olympic barbell", "15-45 lb Dumbbell pairs", "Bumper Plates weight > 300 lbs",
        "53 lb kettlebells", "32 lb kettlebells", "jump ropes", "18 inch plyometric box", "24 inch Plyometric box", "32 inch Plyometric box",
        "pull up bar", "squat rack", "Assault Fitness Assault Bike",
        "Assault Fitness Treadmill", "Concept 2 Rower"
    ],
    weather: "current Woodland, CA weather",
    location: "garage home gym, running path, home street in Woodland, CA 95776",
    indoorAndOutdoorWorkout: false,
    includeExercises: [],
    excludeExcercises: [],
    wodRequestTime: "5:42 PM"
};

// Instantiate the OpenAIWorkoutAdapter
const workoutAdapter = new OpenAIWorkoutAdapter();

async function testGenerateWod() {
    try {
        console.log("Generating workout plan...");
        const result = await workoutAdapter.generateWod(userId, userProfile, workoutOptions);

        // Format the WOD JSON into a markdown string
        const formattedWod = formatWodToMarkdown(result.wod);

        console.log("Generated WOD:");
        console.log(formattedWod);

        // Also show the raw JSON for debugging
        console.log("\nRaw WOD JSON:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error generating WOD:", error);
    }
}

testGenerateWod();