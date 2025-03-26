import { z } from "zod";
import { warmupCooldownSchema } from "./workout.types";
import { Schema } from "mongoose";
import { ObjectId } from "mongodb";

// Base exercise schema used across different parts of the WOD
const exerciseSchema = z.object({
    exercise: z.string(),
    reps: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    distance: z.string().optional(),
    type: z.string().optional(),
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

// Base activity schema for warmup and cooldown
const activitySchema = z.object({
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
});

// Main WOD schema for AI response
export const wodSchema = z.object({
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
        exercises: z.array(exerciseSchema).optional(),
    }),
    cooldown: warmupCooldownSchema,
    recovery: z.string().optional(),
});

export const aiWodResponseSchema = z.object({
    description: z.string(),
    duration: z.string().optional(),
    wod: wodSchema
});

// Database WOD type
interface WodType {
    _id?: ObjectId | string;
    wodId: string;
    userId: string;
    description: string;
    wod: {
        workout: {
            type: string;
            wodDescription?: string;
            wodStrategy?: string;
            wodGoal?: string;
            duration?: string;
            wodCutOffTime?: string;
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

// Validation schema for database operations
const wodValidationSchema = z.object({
    _id: z.union([z.string(), z.instanceof(ObjectId)]).optional(),
    wodId: z.string(),
    userId: z.string(),
    description: z.string(),
    wod: z.object({
        workout: z.object({
            type: z.string(),
            wodDescription: z.string().optional(),
            wodStrategy: z.string().optional(),
            wodGoal: z.string().optional(),
            duration: z.string().optional(),
            wodCutOffTime: z.string().optional(),
            rest: z.string().optional(),
            exercises: z.array(exerciseSchema).optional(),
            rounds: z.number().optional(),
        }),
        warmup: z.object({
            type: z.string(),
            duration: z.string().optional(),
            activities: z.array(activitySchema).optional(),
        }).optional(),
        cooldown: z.object({
            type: z.string(),
            duration: z.string().optional(),
            activities: z.array(activitySchema).optional(),
        }).optional(),
    }),
    createdAt: z.date(),
    updatedAt: z.date()
});

// Mongoose schema for database operations
const wodMongoSchema = new Schema({
    wodId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    wod: {
        workout: {
            type: { type: String, required: true },
            wodDescription: { type: String, required: false },
            wodStrategy: { type: String, required: false },
            wodGoal: { type: String, required: false },
            duration: { type: String, required: false },
            wodCutOffTime: { type: String, required: false },
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
            type: { type: String, required: true },
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
            type: { type: String, required: true },
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
}, {
    timestamps: true,
    versionKey: false
});

export { WodType, wodValidationSchema, wodMongoSchema, exerciseSchema };

export type AiWodSchema = z.infer<typeof aiWodResponseSchema>;
export type WodDay = z.infer<typeof wodSchema>;
export type Wod = z.infer<typeof wodValidationSchema>;