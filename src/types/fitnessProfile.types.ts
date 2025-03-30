import { z } from "zod";
import { Schema } from "mongoose";

// Define TypeScript interface for fitness profile
export interface FitnessProfile {
    userId: string;
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel: "beginner" | "intermediate" | "advanced";
    goals: Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">;
    injuriesOrLimitations?: string[];
    availableEquipment: string[];
    preferredTrainingDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
    preferredWorkoutDuration?: "short" | "medium" | "long"; // short: 15-30 min, medium: 30-60 min, long: 60+ min
    locationPreference?: "gym" | "home" | "park" | "indoor" | "outdoor" | "both";
    createdAt: Date;
    updatedAt: Date;
}

// Define Zod schema for validation
export const fitnessProfileSchema = z.object({
    userId: z.string(),
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
    goals: z.array(z.enum([
        "weight loss",
        "muscle gain",
        "strength",
        "endurance",
        "power",
        "flexibility",
        "general fitness"
    ])),
    injuriesOrLimitations: z.array(z.string()).optional(),
    availableEquipment: z.array(z.string()),
    preferredTrainingDays: z.array(z.enum([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ])).optional(),
    preferredWorkoutDuration: z.enum(["short", "medium", "long"]).optional(),
    locationPreference: z.enum([
        "gym",
        "home",
        "park",
        "indoor",
        "outdoor",
        "both"
    ]).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Define Mongoose schema for MongoDB storage
export const fitnessProfileMongoSchema = new Schema({
    userId: { type: String, required: true, unique: true, description: 'Reference to User.userId' },
    ageRange: { type: String, enum: ["18-24", "25-34", "35-44", "45-54", "55+"], required: false },
    sex: { type: String, enum: ["male", "female", "other"], required: false },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    goals: {
        type: [String], required: true, enum: [
            "weight loss",
            "muscle gain",
            "strength",
            "endurance",
            "power",
            "flexibility",
            "general fitness"
        ]
    },
    injuriesOrLimitations: { type: [String], required: false },
    availableEquipment: { type: [String], required: true },
    preferredTrainingDays: {
        type: [String], enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ], required: false
    },
    preferredWorkoutDuration: { type: String, enum: ["short", "medium", "long"], required: false },
    locationPreference: {
        type: String, enum: [
            "gym",
            "home",
            "park",
            "indoor",
            "outdoor",
            "both"
        ], required: false
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
}); 