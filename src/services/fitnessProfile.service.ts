import { Collection } from "mongodb";
import { FitnessProfile, fitnessProfileSchema } from "../types/fitnessProfile.types";
import { BaseService } from "./base.service";
import { DatabaseError } from "../errors";

export class FitnessProfileService extends BaseService<FitnessProfile> {
    constructor(collection: Collection<FitnessProfile>) {
        super(collection);
    }

    async createProfile(userId: string, profile: Omit<FitnessProfile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<FitnessProfile> {
        try {
            return await this.createWithValidation({
                ...profile,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }, fitnessProfileSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to create fitness profile", error);
        }
    }

    async getProfile(userId: string): Promise<FitnessProfile | null> {
        return this.findOne({ userId });
    }

    async updateProfile(userId: string, profile: Partial<Omit<FitnessProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<FitnessProfile | null> {
        const updateData = {
            ...profile,
            updatedAt: new Date()
        };

        return this.updateWithValidation({ userId }, updateData, fitnessProfileSchema);
    }
} 