import { z } from "zod";

// Common Schema Components
const activitySchema = z.object({
    activity: z.string().optional(),
    duration: z.string().optional(),
    intensity: z.string().optional(),
    reps: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    distance: z.string().optional(),
    exercises: z.array(
        z.object({
            name: z.string(),
            reps: z.string().optional(),
            sets: z.string().optional(),
            rest: z.string().optional(),
        })
    ).optional(),
});

const workoutExerciseSchema = z.object({
    exercise: z.string(),
    reps: z.string().optional(),
    rounds: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    distance: z.string().optional(),
    goal: z.string().optional(),
    scalingOptions: z.array(
        z.object({
            description: z.string().optional(),
            exercise: z.string().optional(),
            reps: z.string().optional(),
        })
    ).optional(),
    personalBestReference: z.boolean().optional(),
});

const warmupCooldownSchema = z.object({
    type: z.string(),
    duration: z.string().optional(),
    activities: z.array(activitySchema).optional(),
}).optional();

const workoutDaySchema = z.object({
    day: z.number(),
    periodization: z.object({
        phase: z.string(),
        focus: z.string(),
        intensity: z.string(),
        volume: z.string()
    }).optional(),
    warmup: warmupCooldownSchema,
    workout: z.object({
        type: z.string(),
        restDay: z.boolean().optional(),
        duration: z.string().optional(),
        exercises: z.array(workoutExerciseSchema).optional(),
    }),
    cooldown: warmupCooldownSchema,
    recovery: z.string().optional(),
});

const workoutPlanSchema = z.object({
    week: z.number(),
    periodization: z.object({
        type: z.string(),
        focus: z.string(),
        intensity: z.string(),
        volume: z.string()
    }).optional(),
    days: z.array(workoutDaySchema),
});

export const aiWorkoutResponseSchema = z.object({
    workoutProgramDescription: z.string(),
    workoutPlanDuration: z.string(),
    workoutPlanType: z.string(),
    continuationToken: z.object({
        token: z.string(),
        currentWeek: z.number(),
        missingDays: z.array(z.number()),
        missingWeeks: z.array(z.number()),
        nextWeek: z.number().optional(),
    }),
    workoutPlan: z.array(workoutPlanSchema),
});

export const workoutPlanDBSchema = z.object({
    id: z.string(),
    workoutProgramDescription: z.string(),
    workoutPlanDuration: z.string(),
    workoutPlanType: z.string(),
    continuationToken: z.object({
        token: z.string(),
        currentWeek: z.number().optional(),
        missingDays: z.array(z.number()),
        missingWeeks: z.array(z.number()),
    }).optional(),
    workoutPlan: z.array(workoutPlanSchema),
});

export type GeneratedWorkoutPlan = z.infer<typeof aiWorkoutResponseSchema>;
export type WorkoutPlan = z.infer<typeof workoutPlanDBSchema>;

// Workout Result Schema
export const workoutResultSchema = z.object({
    workoutId: z.string(),
    userId: z.string(),
    date: z.string().datetime({ offset: true }),
    modality: z.string(),
});

export const crossfitResultSchema = workoutResultSchema.extend({
    results: z.array(
        z.object({
            exercise: z.string(),
            sets: z.array(
                z.object({
                    reps: z.number().int().positive(),
                    weight: z.number().optional(),
                    notes: z.string().optional(),
                })
            ).optional(),
            scaling: z.string().optional(),
            roundsCompleted: z.number().int().positive().optional(),
            timeTaken: z.string().optional(),
        })
    ),
});

export type WorkoutResult = z.infer<typeof workoutResultSchema>;

export const workoutOptionsSchema = z.object({
    scaling: z.string().default("bodyweight"),
    includeScalingOptions: z.boolean().default(true),
    workoutPlanDuration: z.string().default("4 weeks"),
    workoutDuration: z.string().default("60 minutes"),
    workoutFocus: z.string().default("Strength & Conditioning"),
    preferredTrainingDays: z.array(z.string()).default(["Monday", "Wednesday", "Friday"]),
    includeWarmups: z.boolean().default(true),
    includeAlternateMovements: z.boolean().default(true),
    includeCooldown: z.boolean().default(true),
    includeRestDays: z.boolean().default(true),
    includeBenchmarkWorkouts: z.boolean().default(true),
    periodization: z.string().default("concurrent"),
}).default({});

export const createWorkoutSchema = z.object({
    userId: z.string().uuid(),
    workoutId: z.string().optional(),
    numberOfWeeks: z.number().min(1).max(12),
    workoutOptions: workoutOptionsSchema,
});

export type CreateWorkoutDTO = z.infer<typeof createWorkoutSchema>;
