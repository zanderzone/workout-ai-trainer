import { WorkoutResult, WorkoutPlanDB } from "./workout.types";
import { ContinuationToken } from "./continuationToken.types";
import { WorkoutOptions } from "./workoutOptions.types";

export interface WorkoutAIAdapter {
    generateWorkout(
        userId: string,
        userProfile: any,
        pastResults: WorkoutResult[],
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks?: number
    ): Promise<{ workoutPlan: WorkoutPlanDB; continuationToken?: ContinuationToken | null }>;
}
