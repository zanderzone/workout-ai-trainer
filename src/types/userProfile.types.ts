import { z } from "zod";
import { Schema } from "mongoose";
// Define TypeScript interface for user
interface UserProfile {
    userId: string;
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    preferredWorkoutDays?: string[];
    goals?: string[];
    equipmentAvailable?: string[];
    injuriesOrLimitations?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchemaZod = z.object({
    userId: z.string().uuid(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    preferredWorkoutDays: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    equipmentAvailable: z.array(z.string()).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});


const userSchema = new Schema({
    userId: { type: String, required: true }, // UUID-based ID, no real-world identifiers
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], required: false },
    preferredWorkoutDays: { type: [String], required: false },
    goals: { type: [String], required: false },
    equipmentAvailable: { type: [String], required: false },
    injuriesOrLimitations: { type: [String], required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});


export { UserProfile, userSchemaZod, userSchema}