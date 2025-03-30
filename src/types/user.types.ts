import { Schema } from "mongoose";
import { z } from "zod";
import { ObjectId, WithId } from "mongodb";

// Base user type without _id
export interface BaseUser {
    userId: string;                   // Unique user identifier
    providerId: string;               // OAuth provider ID (Google/Apple)
    provider: "google" | "apple";     // OAuth provider type
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profilePicture?: string;
    accountStatus?: "active" | "disabled";
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
    userId: z.string().uuid(),
    providerId: z.string().describe('OAuth provider ID (Google/Apple)'),
    provider: z.enum(['google', 'apple']),
    email: z.string().email(),
    emailVerified: z.boolean(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    profilePicture: z.string().optional(),
    accountStatus: z.enum(['active', 'disabled']).optional(),
    refreshToken: z.string().optional(),
    tokenExpiresAt: z.date().optional(),
    isRegistrationComplete: z.boolean().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

const userMongoSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    providerId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, required: true },
    provider: { type: String, required: true, enum: ['google', 'apple'] },
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    profilePicture: { type: String },
    accountStatus: { type: String, enum: ['active', 'disabled'] },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    isRegistrationComplete: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
});

export { User, userSchema, userMongoSchema }; 