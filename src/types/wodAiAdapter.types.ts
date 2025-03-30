import { AiWodSchema } from "./wod.types";
import { FitnessProfile } from "./fitnessProfile.types";
import { WorkoutRequest } from "./workoutRequest.types";

export interface WodAIAdapter {
    generateWod(
        userId: string,
        fitnessProfile?: FitnessProfile,
        workoutRequest?: WorkoutRequest
    ): Promise<{ wod: AiWodSchema }>;
}
