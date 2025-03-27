import { Collection } from "mongodb";
import { WorkoutOptions } from "../types/workoutOptions.types";
import { BaseService } from "./base.service";
import { DatabaseError } from "../errors";
import { WorkoutOptionsSchema } from "../types/workoutOptions.types";

export class WorkoutOptionsService extends BaseService<WorkoutOptions> {
    constructor(collection: Collection<WorkoutOptions>) {
        super(collection);
    }

    async createOptions(userId: string, options: Omit<WorkoutOptions, 'userId' | 'createdAt' | 'updatedAt'>): Promise<WorkoutOptions> {
        try {
            return await this.createWithValidation({
                ...options,
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }, WorkoutOptionsSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to create workout options", error);
        }
    }

    async getUserOptions(userId: string): Promise<WorkoutOptions | null> {
        return this.findOne({ userId });
    }

    async updateOptions(userId: string, options: Partial<Omit<WorkoutOptions, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<WorkoutOptions | null> {
        const updateData = {
            ...options,
            updatedAt: new Date()
        };

        return this.updateWithValidation({ userId }, updateData, WorkoutOptionsSchema);
    }
} 