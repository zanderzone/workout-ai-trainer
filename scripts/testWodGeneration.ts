import { OpenAIWorkoutAdapter } from "../src/services/wod.service";
import { WorkoutOptions } from "../src/types/workoutOptions.types";
import { UserProfile } from "../src/types/userProfile.types";
import { v4 as uuidv4 } from 'uuid';
// Mock user profile and workout options
const userProfile: UserProfile = {
    ageRange: "45-54",
    sex: "male",
    fitnessLevel: "beginner",
    goals: ["weight loss", "strength", "athletic conditioning", "endurance", "hypertrophy"],
    injuriesOrLimitations: ["left knee tightness"]
};

const workoutOptions: WorkoutOptions = {
    totalAvailableTime: "45 minutes",
    userDescription: "I'd like an intense workout that focuses on strength and conditioning. Can you structure this for a group of experienced and intermediate level Crossfit athetes?",
    workoutDuration: "8 minutes <= duration <= 10 minutes",
    scaling: "shorter duration, shorter distances, lighter weight or bodyweight exercises",
    includeScalingOptions: true,
    includeWarmups: true,
    includeAlternateMovements: true,
    includeCooldown: true,
    includeRestDays: true,
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
    includeExcercises: [],
    excludeExcercises: [],
    wodRequestTime: "7:30 PM"

};

// Instantiate the OpenAIWorkoutAdapter
const workoutAdapter = new OpenAIWorkoutAdapter();

async function testGenerateWod() {
    try {
        const userId = uuidv4();
        userProfile.userId = userId;
        const currentTime = new Date();
        const currentTimeString = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

        const result = await workoutAdapter.generateWod(userId, userProfile, workoutOptions);
        console.log("Generated WOD:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error generating WOD:", error);
    }
}

testGenerateWod();