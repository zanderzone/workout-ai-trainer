import { z } from "zod";
import { Schema } from "mongoose";

// Define TypeScript interface for user
interface UserProfile {
    userId: string;  // OAuth sub ID (from Google/Apple)
    provider: "google" | "apple";  // Identifies authentication provider
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+"; // Age stored as a range instead of exact value
    sex?: "male" | "female" | "other";  // Sex stored for workout customization
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    preferredWorkoutDays?: string[];
    goals?: string[];
    equipmentAvailable?: string[];
    injuriesOrLimitations?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Define Zod schema for validation
const userProfileSchema = z.object({
    userId: z.string(),  // OAuth sub ID (UUID-like)
    provider: z.enum(["google", "apple"]),
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    preferredWorkoutDays: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    equipmentAvailable: z.array(z.string()).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Define Mongoose schema for MongoDB storage
const userSchema = new Schema({
    userId: { type: String, required: true, unique: true },  // OAuth user ID (sub)
    provider: { type: String, enum: ["google", "apple"], required: true },  // OAuth provider
    ageRange: { type: String, enum: ["18-24", "25-34", "35-44", "45-54", "55+"], required: false },
    sex: { type: String, enum: ["male", "female", "other"], required: false },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], required: false },
    preferredWorkoutDays: { type: [String], required: false },
    goals: { type: [String], required: false },
    equipmentAvailable: { type: [String], required: false },
    injuriesOrLimitations: { type: [String], required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export { UserProfile, userProfileSchema, userSchema };
