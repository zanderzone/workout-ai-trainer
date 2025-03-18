import { Schema } from "mongoose";
import { z } from "zod";
import { ObjectId, WithId } from "mongodb";

// Base user type without _id
export interface BaseUser {
    providerId: string;
    email: string;
    provider: 'google' | 'apple';
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    injuriesOrLimitations?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// MongoDB document type with required _id
export type User = WithId<BaseUser>;

// Extend Express User type
declare global {
    namespace Express {
        interface User extends BaseUser {
            _id?: ObjectId;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const userSchema = z.object({
    _id: z.instanceof(ObjectId).optional(),
    providerId: z.string().describe('OAuth provider ID (Google/Apple)'),
    email: z.string().email(),
    provider: z.enum(['google', 'apple']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    profilePicture: z.string().optional(),
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    goals: z.array(z.string()).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const userMongoSchema = new Schema({
    _id: { type: ObjectId, auto: true },
    providerId: { type: String, required: true, unique: true, description: 'OAuth provider ID (Google/Apple)' },
    email: { type: String, required: true, unique: true },
    provider: { type: String, required: true, enum: ['google', 'apple'] },
    firstName: String,
    lastName: String,
    profilePicture: String,
    ageRange: { type: String, enum: ["18-24", "25-34", "35-44", "45-54", "55+"], default: undefined },
    sex: { type: String, enum: ["male", "female", "other"], default: undefined },
    fitnessLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: undefined },
    goals: { type: [String], default: undefined },
    injuriesOrLimitations: { type: [String], default: undefined },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

// Create indexes
userMongoSchema.index({ email: 1 });
userMongoSchema.index({ providerId: 1 }); 