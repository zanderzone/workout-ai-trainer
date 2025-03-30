/* eslint-disable */
// @ts-nocheck
// This file is part of the future workout feature and is temporarily disabled

import { WorkoutResult, WorkoutPlanDB } from "./workout.types";
import { ContinuationToken } from "../../types/continuationToken.types";
import { WorkoutOptions } from "../../types/workoutOptions.types";

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
