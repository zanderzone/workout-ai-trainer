import { z } from "zod";
import { Schema } from "mongoose";

// Define TypeScript interface for user profile
interface UserProfile {
    userId: string;  // Reference to User.providerId
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    injuriesOrLimitations?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Define Zod schema for validation
const userProfileSchema = z.object({
    userId: z.string(),
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    goals: z.array(z.string()).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Define Mongoose schema for MongoDB storage
const userProfileMongoSchema = new Schema({
    userId: { type: String, required: true, unique: true, description: 'Reference to User.providerId' },
    ageRange: { type: String, enum: ["18-24", "25-34", "35-44", "45-54", "55+"], required: false },
    sex: { type: String, enum: ["male", "female", "other"], required: false },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], required: false },
    goals: { type: [String], required: false },
    injuriesOrLimitations: { type: [String], required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

// Create index on userId for faster lookups
userProfileMongoSchema.index({ userId: 1 });

export { UserProfile, userProfileSchema, userProfileMongoSchema };
