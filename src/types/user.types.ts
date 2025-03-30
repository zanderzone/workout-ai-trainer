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
    displayName?: string;
    profilePicture?: string;
    emailVerified?: boolean;
    accountStatus?: 'active' | 'disabled';
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    injuriesOrLimitations?: string[];
    // Token management
    refreshToken?: string;
    tokenExpiresAt?: Date;
    isRegistrationComplete?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// MongoDB document type with required _id
type User = WithId<BaseUser>;

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

const userSchema = z.object({
    _id: z.instanceof(ObjectId).optional(),
    providerId: z.string().describe('OAuth provider ID (Google/Apple)'),
    email: z.string().email(),
    provider: z.enum(['google', 'apple']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    profilePicture: z.string().optional(),
    emailVerified: z.boolean().optional(),
    accountStatus: z.enum(['active', 'disabled']).optional(),
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    goals: z.array(z.string()).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    // Token management
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.date().optional(),
    isRegistrationComplete: z.boolean().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

const userMongoSchema = new Schema({
    providerId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    provider: { type: String, required: true },
    picture: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

export { User, userSchema, userMongoSchema }; 