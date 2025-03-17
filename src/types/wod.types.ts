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

// MongoDB schema for Wod
export const wodMongoSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    uuid: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    duration: { type: String },
    wod: {
        warmup: {
            type: { type: String },
            duration: { type: String },
            activities: [{
                activity: String,
                duration: String,
                intensity: String,
                reps: String,
                weight: String,
                height: String,
                distance: String,
                exercises: [{
                    name: String,
                    reps: String,
                    sets: String,
                    rest: String
                }]
            }]
        },
        workout: {
            type: { type: String, required: true },
            wodDescription: String,
            wodStrategy: String,
            wodGoal: String,
            duration: String,
            wodCutOffTime: String,
            rounds: Number,
            rest: String,
            exercises: [{
                exercise: { type: String, required: true },
                reps: String,
                weight: String,
                height: String,
                distance: String,
                type: String,
                scalingOptions: [{
                    description: String,
                    exercise: String,
                    reps: String
                }],
                personalBestReference: Boolean
            }]
        },
        cooldown: {
            type: { type: String },
            duration: { type: String },
            activities: [{
                activity: String,
                duration: String,
                intensity: String,
                reps: String,
                weight: String,
                height: String,
                distance: String,
                exercises: [{
                    name: String,
                    reps: String,
                    sets: String,
                    rest: String
                }]
            }]
        },
        recovery: String
    }
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes
wodMongoSchema.index({ userId: 1, createdAt: -1 });

export type AiWodSchema = z.infer<typeof aiWodResponseSchema>;
export type WodDay = z.infer<typeof wodSchema>;

export const Wod = z.object({
    _id: z.string(),
    userId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    description: z.string(),
    duration: z.string().optional(),
    wod: wodSchema
});

export type Wod = z.infer<typeof Wod>;