import { Collection } from "mongodb";
import { UserProfile, userProfileSchema } from "../types/userProfile.types";
import { BaseService } from "./base.service";
import { DatabaseError } from "../errors";

export class UserProfileService extends BaseService<UserProfile> {
    constructor(collection: Collection<UserProfile>) {
        super(collection);
    }

    async createProfile(userId: string, profile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
        try {
            return await this.createWithValidation({
                ...profile,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }, userProfileSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to create user profile", error);
        }
    }

    async getProfile(userId: string): Promise<UserProfile | null> {
        return this.findOne({ userId });
    }

    async updateProfile(userId: string, profile: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile | null> {
        const updateData = {
            ...profile,
            updatedAt: new Date()
        };

        return this.updateWithValidation({ userId }, updateData, userProfileSchema);
    }
} 