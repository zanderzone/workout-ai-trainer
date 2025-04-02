import { Collection } from "mongodb";
import { WorkoutRequest, workoutRequestSchema } from "../types/workoutRequest.types";
import { BaseService } from "./base.service";
import { DatabaseError } from "../errors";
import { v4 as uuidv4 } from 'uuid';

export class WorkoutRequestService extends BaseService<WorkoutRequest> {
    constructor(collection: Collection<WorkoutRequest>) {
        super(collection);
    }

    async createRequest(userId: string, request: Omit<WorkoutRequest, 'requestId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<WorkoutRequest> {
        try {
            return await this.createWithValidation({
                ...request,
                requestId: uuidv4(),
                userId,
                wodRequestTime: request.wodRequestTime || new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }, workoutRequestSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to create workout request", error);
        }
    }

    async getRequest(requestId: string): Promise<WorkoutRequest | null> {
        return this.findOne({ requestId });
    }

    async getUserRequests(userId: string): Promise<WorkoutRequest[]> {
        return this.find({ userId });
    }

    async updateRequest(requestId: string, request: Partial<Omit<WorkoutRequest, 'requestId' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<WorkoutRequest | null> {
        const updateData = {
            ...request,
            updatedAt: new Date()
        };

        return this.updateWithValidation({ requestId }, updateData, workoutRequestSchema);
    }

    async deleteRequest(requestId: string): Promise<boolean> {
        return this.delete({ requestId });
    }
} 