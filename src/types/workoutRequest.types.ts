import { z } from "zod";
import { Schema } from "mongoose";

export interface WorkoutRequest {
    requestId: string;
    userId: string;
    userDescription?: string; // Optional user notes: "I want to improve my conditioning"
    scalingPreference?: string; // "lighter weight", "bodyweight", "advanced"
    includeScalingOptions?: boolean;
    totalAvailableTime?: number; // in minutes
    workoutPlanDuration?: number; // in weeks (if multi-week plan)
    workoutFocus?: "Strength" | "Conditioning" | "Strength & Conditioning" | "Mobility" | "Endurance";
    includeWarmups?: boolean;
    includeAlternateMovements?: boolean;
    includeCooldown?: boolean;
    includeRestDays?: boolean;
    includeBenchmarkWorkouts?: boolean;
    outdoorWorkout?: boolean;
    periodization?: "concurrent" | "linear" | "undulating";
    currentWeather?: "rainy" | "sunny" | "cloudy" | "snowy" | "indoor";
    includeExercises?: string[]; // user-requested movements
    excludeExercises?: string[]; // user-excluded movements
    wodRequestTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Define Zod schema for validation
export const workoutRequestSchema = z.object({
    requestId: z.string().uuid(),
    userId: z.string(),
    userDescription: z.string().max(500).optional(),
    scalingPreference: z.string().optional(),
    includeScalingOptions: z.boolean().optional(),
    totalAvailableTime: z.number().int().positive().optional(),
    workoutPlanDuration: z.number().int().positive().optional(),
    workoutFocus: z.enum([
        "Strength",
        "Conditioning",
        "Strength & Conditioning",
        "Mobility",
        "Endurance"
    ]).optional(),
    includeWarmups: z.boolean().optional(),
    includeAlternateMovements: z.boolean().optional(),
    includeCooldown: z.boolean().optional(),
    includeRestDays: z.boolean().optional(),
    includeBenchmarkWorkouts: z.boolean().optional(),
    outdoorWorkout: z.boolean().optional(),
    periodization: z.enum([
        "concurrent",
        "linear",
        "undulating"
    ]).optional(),
    currentWeather: z.enum([
        "rainy",
        "sunny",
        "cloudy",
        "snowy",
        "indoor"
    ]).optional(),
    includeExercises: z.array(z.string()).optional(),
    excludeExercises: z.array(z.string()).optional(),
    wodRequestTime: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});

// Define Mongoose schema for MongoDB storage
export const workoutRequestMongoSchema = new Schema({
    requestId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userDescription: { type: String, required: false },
    scalingPreference: { type: String, required: false },
    includeScalingOptions: { type: Boolean, required: false },
    totalAvailableTime: { type: Number, required: false },
    workoutPlanDuration: { type: Number, required: false },
    workoutFocus: {
        type: String,
        enum: [
            "Strength",
            "Conditioning",
            "Strength & Conditioning",
            "Mobility",
            "Endurance"
        ],
        required: false
    },
    includeWarmups: { type: Boolean, required: false },
    includeAlternateMovements: { type: Boolean, required: false },
    includeCooldown: { type: Boolean, required: false },
    includeRestDays: { type: Boolean, required: false },
    includeBenchmarkWorkouts: { type: Boolean, required: false },
    outdoorWorkout: { type: Boolean, required: false },
    periodization: {
        type: String,
        enum: ["concurrent", "linear", "undulating"],
        required: false
    },
    currentWeather: {
        type: String,
        enum: ["rainy", "sunny", "cloudy", "snowy", "indoor"],
        required: false
    },
    includeExercises: { type: [String], required: false },
    excludeExercises: { type: [String], required: false },
    wodRequestTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
}); 