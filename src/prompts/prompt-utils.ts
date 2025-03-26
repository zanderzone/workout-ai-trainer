import { generateSystemPrompt } from "./system-prompt";
import { generateUserPrompt } from "./user-prompt";
import { UserProfile } from "../types/userProfile.types";
import { WorkoutOptions } from "../types/workoutOptions.types";

export const validatePrompt = (prompt: string): boolean => {
    // Basic validation to ensure prompt is not empty and contains required sections
    return prompt.length > 0;
};

export const validateSystemPrompt = (prompt: string): boolean => {
    return validatePrompt(prompt) &&
        prompt.includes("## **Workout Plan Requirements**");
};

export const validateUserPrompt = (prompt: string): boolean => {
    return validatePrompt(prompt) &&
        prompt.includes("## **User Inputs**") &&
        prompt.includes("## **User Preferences**");
};
