import { OpenAIWorkoutAdapter } from "../src/services/workout.service";
import dotenv from "dotenv";

dotenv.config();

async function testGenerateWorkout() {
    const aiAdapter = new OpenAIWorkoutAdapter();

    const userProfile = {
        name: "Zander",
        age: 25,
        sex: "Male",
        weight: "210 lbs",
        height: "5'7\"",
        nationality: "Filipino",
        availableEquipment: ["barbell", "kettlebell", "pull-up bar"],
        workoutFocus: "Strength & Conditioning",
        userPreferences: {
            fitness_level: "intermediate",
            preferred_training_modality: "CrossFit",
            training_goal: ["muscle gain", "weight loss", "strength and conditioning", "mobility"],
            available_equipment: [
                "45 lb barbell",
                "35 lb barbell",
                "Dumbbells",
                "Bumper Plates weight > 300 lbs",
                "kettlebells",
                "jump ropes",
                "24 inch Ploymetric box",
                "32 inch Ploymetric box",
                "pull up bar",
                "squat rack",
                "Assault Fitness Assault Bike",
                "Assault Fitness Treadmill",
                "Concept 2 Rower"
            ],
            preferred_exercises: [
                "back squats",
                "front squats",
                "deadlifts",
                "rowing",
                "assault bike",
                "clean",
                "power clean",
                "clean and jerk",
                "Power Snatch",
                "snatch",
                "box jumps",
                "pull ups",
                "push ups",
                "dips",
                "burpees",
                "kettlebell swings",
                "presses",
                "push presses",
                "power jerk",
                "jerk",
                "hang power clean",
                "hang power snatch",
                "weighted or unweighted alternative dumbbell lunges"
            ]
        },
        workoutOptions: {
            scaling: "moderate or bodyweight",
            workout_duration:"60 minutes",
            preferred_training_days:  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            include_warmups: true,
            include_alternate_movements: true,
            include_cooldown: true,
            include_rest_days: true,
            include_benchmark_workouts: true,
        }

    };

    const pastResults = [
        { workout: "Fran", time: "2:45", scaling: "Rx" },
        { workout: "Back Squat", weight: "450 lbs", reps: "1" },
        { workout: "Clean & Jerk", weight: "153 kg", reps: "1" },
        { workout: "Snatch", weight: "123 kg", reps: "1" }
    ];

    const continuationToken = null; // Use null initially, test with token later

    try {
        // TODO: Consider including personal bests as a parameter to include in the prompts
        const response = await aiAdapter.generateWorkout("user123", userProfile, pastResults, continuationToken);

        console.log("Generated Workout Plan:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error in AI Response:", error);
    }
}

testGenerateWorkout();
