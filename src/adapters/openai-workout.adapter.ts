import { WodAIAdapter, WodResponse } from "../types/wod.types";
import { v4 as uuidv4 } from "uuid";

export class OpenAIWorkoutAdapter implements WodAIAdapter {
    constructor() {
        // TODO: Initialize OpenAI client when implementing actual integration
    }

    async generateWod(
        userId: string,
        _fitnessProfile?: any,
        _workoutRequest?: any
    ): Promise<WodResponse> {
        // TODO: Implement actual OpenAI integration
        // For now, return a mock WOD
        return {
            wod: {
                wodId: uuidv4(),
                userId,
                description: "Mock WOD",
                warmup: {
                    type: "warmup",
                    activities: []
                },
                workout: {
                    type: "strength",
                    exercises: [
                        {
                            exercise: "Push-ups",
                            reps: "10"
                        }
                    ]
                },
                cooldown: {
                    type: "cooldown",
                    activities: []
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };
    }
} 