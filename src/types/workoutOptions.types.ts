import { z } from "zod";

export interface WorkoutOptions {
    scaling: string; // e.g., "lighter weight or bodyweight exercises"
    includeScalingOptions: boolean;
    workoutPlanDuration: string; // e.g., "4 weeks"
    workoutDuration: string; // e.g., "60 minutes"
    workoutFocus: string; // e.g., "Strength & Conditioning"
    preferredTrainingDays: string[]; // e.g., ["Monday", "Tuesday", ...]
    includeWarmups: boolean;
    includeAlternateMovements: boolean;
    includeCooldown: boolean;
    includeRestDays: boolean;
    includeBenchmarkWorkouts: boolean;
    periodization: string; // e.g., "concurrent", "linear", "undulating" - AI determines structure
}

export const WorkoutOptionsSchema = z.object({
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
    periodization: z.string().optional()
});
