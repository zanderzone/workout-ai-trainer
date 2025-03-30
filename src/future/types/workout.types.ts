/* eslint-disable */
// @ts-nocheck
// This file is part of the future workout feature and is temporarily disabled

import { z } from "zod";
import { Schema } from "mongoose";
import { ObjectId } from "mongodb";

// Common Schema Components
export const activitySchema = z.object({
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

export const workoutExerciseSchema = z.object({
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

export const warmupCooldownSchema = z.object({
    type: z.string(),
    duration: z.string().optional(),
    activities: z.array(activitySchema).optional(),
}).optional();

export const workoutDaySchema = z.object({
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

export const workoutPlanSchema = z.object({
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

export type GeneratedWorkoutPlan = z.infer<typeof aiWorkoutResponseSchema>;
export type WorkoutPlanWeek = z.infer<typeof workoutPlanSchema>;
export type WorkoutPlanDB = z.infer<typeof workoutPlanDBSchema>;

// Workout Result Schema
export interface WorkoutResult {
    _id?: ObjectId | string;
    userId: string;
    workoutId: string;
    date: Date;
    modality: string;
    results?: {
        exercise: string;
        sets?: {
            reps: number;
            weight?: number;
            notes?: string;
        }[];
        scaling?: string;
        roundsCompleted?: number;
        timeTaken?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export const workoutResultSchema = z.object({
    _id: z.union([z.string(), z.instanceof(ObjectId)]).optional(),
    userId: z.string(),
    workoutId: z.string(),
    date: z.date(),
    modality: z.string(),
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
    ).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const workoutResultMongoSchema = new Schema<WorkoutResult>({
    _id: { type: String, required: false },
    userId: { type: String, required: true },
    workoutId: { type: String, required: true },
    date: { type: Date, required: true },
    modality: { type: String, required: true },
    results: [{
        exercise: { type: String, required: true },
        sets: [{
            reps: { type: Number, required: true },
            weight: { type: Number, required: false },
            notes: { type: String, required: false }
        }],
        scaling: { type: String, required: false },
        roundsCompleted: { type: Number, required: false },
        timeTaken: { type: String, required: false }
    }],
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

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

export const workoutPlanDBSchema = z.object({
    _id: z.union([z.string(), z.instanceof(ObjectId)]).optional(),
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
    createdAt: z.date(),
    updatedAt: z.date()
});
