import { Collection } from "mongodb";
import { WodType, WodResponse, WodAIAdapter } from "../types/wod.types";
import { FitnessProfile } from "../types/fitnessProfile.types";
import { WorkoutRequest } from "../types/workoutRequest.types";
import { v4 as uuidv4 } from "uuid";
import { enhancedWodValidationSchema } from "../validation/workout.validation";
import { z } from "zod";
import { OpenAIWorkoutAdapter } from "../adapters/openai-workout.adapter";
import { WodValidationError } from "../errors/wod";

export class WodService {
    private collection: Collection<WodType>;
    private aiAdapter: WodAIAdapter;

    constructor(collection: Collection<WodType>, aiAdapter: WodAIAdapter) {
        this.collection = collection;
        this.aiAdapter = aiAdapter;
    }

    async generateWod(
        userId: string,
        fitnessProfile?: FitnessProfile,
        workoutRequest?: WorkoutRequest
    ): Promise<WodResponse> {
        try {
            // Generate WOD using AI adapter
            const result = await this.aiAdapter.generateWod(userId, fitnessProfile, workoutRequest);

            // Add metadata to the WOD
            const wodWithMetadata = {
                ...result.wod,
                wodId: uuidv4(),
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validate the WOD before saving
            const validatedWod = enhancedWodValidationSchema.parse(wodWithMetadata);

            // Save to database
            await this.create(validatedWod);

            return result;
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new WodValidationError("Invalid WOD data", error.errors);
            }
            throw error;
        }
    }

    async getRecentWorkouts(userId: string, limit: number = 5): Promise<WodType[]> {
        try {
            const workouts = await this.collection
                .find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            return workouts;
        } catch (error) {
            console.error('Error fetching recent workouts:', error);
            throw new Error('Failed to fetch recent workouts');
        }
    }

    async create(wod: Omit<WodType, '_id'>): Promise<WodType> {
        const result = await this.collection.insertOne(wod as WodType);
        return { ...wod, _id: result.insertedId };
    }

    async getByWodId(wodId: string): Promise<WodType | null> {
        const doc = await this.collection.findOne({ wodId });
        return doc as WodType | null;
    }

    async getByUserId(userId: string): Promise<WodType[]> {
        const docs = await this.collection.find({ userId }).toArray();
        return docs as WodType[];
    }

    async update(wodId: string, updateData: Partial<WodType>): Promise<WodType | null> {
        const result = await this.collection.findOneAndUpdate(
            { wodId },
            { $set: { ...updateData, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result?.value || null;
    }

    async delete(wodId: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ wodId });
        return result.deletedCount === 1;
    }
}

// Factory function to create a WOD service instance
export function getWodGenerator(collection: Collection<WodType>): WodService {
    // Remove MCP-related code and simplify adapter initialization
    const aiAdapter = new OpenAIWorkoutAdapter();
    return new WodService(collection, aiAdapter);
}
