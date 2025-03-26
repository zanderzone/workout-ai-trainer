import { UserProfile } from "../types/userProfile.types";
import { WorkoutOptions } from "../types/workoutOptions.types";

export const generateUserPrompt = (userProfile: UserProfile, workoutOpts?: WorkoutOptions | null) => {
    return `## **User Inputs**
    - **User Profile:** ${JSON.stringify(userProfile)}
    - **Workout Options:** ${JSON.stringify(workoutOpts)}
    
    ## **User Preferences**
    - If the user has specified specific excercises or movements, include them in the WOD.
    - If the athlete has excluded specific excercises, ensure they are not included in the WOD.
    - Consider the user's experience level when selecting movements and weights.
    - Adjust the workout intensity based on the user's fitness level.
    - Take into account any injuries or limitations specified in the user profile.
    - Consider the user's available equipment when designing the workout.
    - Respect the user's preferred workout duration and time constraints.`;
};
