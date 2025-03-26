import { z } from "zod";

export interface WorkoutOptions {
    userId: string; // Required field for database operations
    userDescription?: string; // e.g., "I want to improve my strength and conditioning"
    scaling?: string; // e.g., "lighter weight or bodyweight exercises"
    includeScalingOptions?: boolean;
    totalAvailableTime?: string; // e.g., "60 minutes"
    workoutPlanDuration?: string; // e.g., "4 weeks"
    workoutDuration?: string; // e.g., "60 minutes"
    workoutFocus?: string; // e.g., "Strength & Conditioning"
    availableEquipment?: string[]; // e.g., ["45 lb barbell", "bodyweight", "20-55 lb dumbells"]
    preferredTrainingDays?: string[]; // e.g., ["Monday", "Tuesday", ...]
    includeWarmups?: boolean;
    includeAlternateMovements?: boolean;
    includeCooldown?: boolean;
    includeRestDays?: boolean;
    includeBenchmarkWorkouts?: boolean;
    outdoorWorkout?: boolean;
    indoorAndOutdoorWorkout?: boolean;
    periodization?: string; // e.g., "concurrent", "linear", "undulating" - AI determines structure
    weather?: string; // e.g., "rainy", "sunny", "cloudy"
    location?: string; // e.g., "gym", "home", "park"
    goals?: string; // e.g., "weight loss", "muscle gain", "endurance"
    includeExcercises?: string[]; // e.g., ["push ups", "pull ups", "squats"]
    excludeExcercises?: string[]; // e.g., ["deadlifts", "bench press"]
    wodRequestTime?: string; // e.g., "11:15 PM"
    createdAt?: Date;
    updatedAt?: Date;
}

export const WorkoutOptionsSchema = z.object({
    userId: z.string(),
    scaling: z.string(),
    includeScalingOptions: z.boolean(),
    workoutPlanDuration: z.string(),
    workoutDuration: z.string(),
    workoutFocus: z.string(),
    preferredTrainingDays: z.array(z.string()),
    includeWarmups: z.boolean(),
    includeAlternateMovements: z.boolean(),
    includeCooldown: z.boolean(),
    includeRestDays: z.boolean(),
    includeBenchmarkWorkouts: z.boolean(),
    periodization: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});
