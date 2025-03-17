import { AiWodSchema } from "./wod.types";
import { WorkoutOptions } from "./workoutOptions.types";

export interface WodAIAdapter {
    generateWod(
        userId: string,
        userProfile: any,
        workoutOpts?: WorkoutOptions | null
    ): Promise<{ wod: AiWodSchema }>;
}
