import { WorkoutResult } from "./workoutResult.types";
import { ContinuationToken } from "./continuationToken.types";
import { WorkoutOptions } from "./workoutOptions.types";
import { WorkoutPlan } from "./workout.types";

export interface WorkoutAIAdapter {
    generateWorkout(
        userId: string,
        userProfile: any,
        pastResults: WorkoutResult[],
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks?: number
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }>;
}
