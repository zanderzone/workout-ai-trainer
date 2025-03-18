import { z } from "zod";
import { warmupCooldownSchema } from "./workout.types";
import { Schema } from "mongoose";
import { ObjectId } from "mongodb";

export const workoutExerciseSchema = z.object({
    exercise: z.string(),
    reps: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    distance: z.string().optional(),
    type: z.string().optional(),
    scalingOptions: z.array(
        z.object({
            description: z.string().optional(),
            exercise: z.string().optional(),
            reps: z.string().optional(),
        })
    ).optional(),
    personalBestReference: z.boolean().optional(),
});

const wodSchema = z.object({
    warmup: warmupCooldownSchema,
    workout: z.object({
        type: z.string(),
        wodDescription: z.string().optional(),
        wodStrategy: z.string().optional(),
        wodGoal: z.string().optional(),
        duration: z.string().optional(),
        wodCutOffTime: z.string().optional(),
        rounds: z.number().optional(),
        rest: z.string().optional(),
        exercises: z.array(workoutExerciseSchema).optional(),
    }),
    cooldown: warmupCooldownSchema,
    recovery: z.string().optional(),
});

export const aiWodResponseSchema = z.object({
    description: z.string(),
    duration: z.string().optional(),
    wod: wodSchema
});

export interface WodType {
    _id?: ObjectId | string;
    wodId: string;
    userId: string;
    description: string;
    wod: {
        workout: {
            type: string;
            duration?: string;
            rest?: string;
            exercises?: Array<{
                exercise: string;
                type?: string;
                reps?: string;
                rounds?: string;
                weight?: string;
                height?: string;
                distance?: string;
                goal?: string;
                scalingOptions?: Array<{
                    description?: string;
                    exercise?: string;
                    reps?: string;
                }>;
                personalBestReference?: boolean;
            }>;
            rounds?: number;
        };
        warmup?: {
            type: string;
            duration?: string;
            activities?: Array<{
                activity?: string;
                duration?: string;
                intensity?: string;
                reps?: string;
                weight?: string;
                height?: string;
                distance?: string;
                exercises?: Array<{
                    name: string;
                    reps?: string;
                    sets?: string;
                    rest?: string;
                }>;
            }>;
        };
        cooldown?: {
            type: string;
            duration?: string;
            activities?: Array<{
                activity?: string;
                duration?: string;
                intensity?: string;
                reps?: string;
                weight?: string;
                height?: string;
                distance?: string;
                exercises?: Array<{
                    name: string;
                    reps?: string;
                    sets?: string;
                    rest?: string;
                }>;
            }>;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export const wodValidationSchema = z.object({
    _id: z.union([z.string(), z.instanceof(ObjectId)]).optional(),
    wodId: z.string(),
    userId: z.string(),
    description: z.string(),
    wod: z.object({
        workout: z.object({
            type: z.string(),
            duration: z.string().optional(),
            rest: z.string().optional(),
            exercises: z.array(z.object({
                exercise: z.string(),
                type: z.string().optional(),
                reps: z.string().optional(),
                rounds: z.string().optional(),
                weight: z.string().optional(),
                height: z.string().optional(),
                distance: z.string().optional(),
                goal: z.string().optional(),
                scalingOptions: z.array(z.object({
                    description: z.string().optional(),
                    exercise: z.string().optional(),
                    reps: z.string().optional(),
                })).optional(),
                personalBestReference: z.boolean().optional(),
            })).optional(),
            rounds: z.number().optional(),
        }),
        warmup: z.object({
            type: z.string(),
            duration: z.string().optional(),
            activities: z.array(z.object({
                activity: z.string().optional(),
                duration: z.string().optional(),
                intensity: z.string().optional(),
                reps: z.string().optional(),
                weight: z.string().optional(),
                height: z.string().optional(),
                distance: z.string().optional(),
                exercises: z.array(z.object({
                    name: z.string(),
                    reps: z.string().optional(),
                    sets: z.string().optional(),
                    rest: z.string().optional(),
                })).optional(),
            })).optional(),
        }).optional(),
        cooldown: z.object({
            type: z.string(),
            duration: z.string().optional(),
            activities: z.array(z.object({
                activity: z.string().optional(),
                duration: z.string().optional(),
                intensity: z.string().optional(),
                reps: z.string().optional(),
                weight: z.string().optional(),
                height: z.string().optional(),
                distance: z.string().optional(),
                exercises: z.array(z.object({
                    name: z.string(),
                    reps: z.string().optional(),
                    sets: z.string().optional(),
                    rest: z.string().optional(),
                })).optional(),
            })).optional(),
        }).optional(),
    }),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const wodMongoSchema = new Schema<WodType>({
    _id: { type: String, required: false },
    wodId: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    wod: {
        workout: {
            type: { type: String, required: true },
            duration: { type: String, required: false },
            rest: { type: String, required: false },
            exercises: [{
                exercise: { type: String, required: true },
                type: { type: String, required: false },
                reps: { type: String, required: false },
                rounds: { type: String, required: false },
                weight: { type: String, required: false },
                height: { type: String, required: false },
                distance: { type: String, required: false },
                goal: { type: String, required: false },
                scalingOptions: [{
                    description: { type: String, required: false },
                    exercise: { type: String, required: false },
                    reps: { type: String, required: false },
                }],
                personalBestReference: { type: Boolean, required: false },
            }],
            rounds: { type: Number, required: false },
        },
        warmup: {
            type: { type: String, required: false },
            duration: { type: String, required: false },
            activities: [{
                activity: { type: String, required: false },
                duration: { type: String, required: false },
                intensity: { type: String, required: false },
                reps: { type: String, required: false },
                weight: { type: String, required: false },
                height: { type: String, required: false },
                distance: { type: String, required: false },
                exercises: [{
                    name: { type: String, required: true },
                    reps: { type: String, required: false },
                    sets: { type: String, required: false },
                    rest: { type: String, required: false },
                }],
            }],
        },
        cooldown: {
            type: { type: String, required: false },
            duration: { type: String, required: false },
            activities: [{
                activity: { type: String, required: false },
                duration: { type: String, required: false },
                intensity: { type: String, required: false },
                reps: { type: String, required: false },
                weight: { type: String, required: false },
                height: { type: String, required: false },
                distance: { type: String, required: false },
                exercises: [{
                    name: { type: String, required: true },
                    reps: { type: String, required: false },
                    sets: { type: String, required: false },
                    rest: { type: String, required: false },
                }],
            }],
        },
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

// Create indexes
wodMongoSchema.index({ userId: 1, createdAt: -1 });

export type AiWodSchema = z.infer<typeof aiWodResponseSchema>;
export type WodDay = z.infer<typeof wodSchema>;
export type Wod = z.infer<typeof wodValidationSchema>;