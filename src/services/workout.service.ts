import { WorkoutPlan, workoutResponseSchema } from "../types/workout.types";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export interface WorkoutAIAdapter {
    generateWorkout(userId: string, userProfile: any, pastResults: any, continuationToken?: { token: string; missingDays: number[] } | null): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: { token: string; missingDays: number[] } | null }>;
}

export interface ContinuationToken {
    token: string;
    missingDays: number[];
    missingWeeks: number[];
    currentWeek?: number;
    nextWeek?: number;
}

// Default implementation using OpenAI
export class OpenAIWorkoutAdapter implements WorkoutAIAdapter {
    private openai: OpenAI;
    
    constructor() {
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    }
    
    // "remainingWeeks": 7,
    // "nextWeek": 2,
    // "remainingDays": 6
    async generateWorkout(
        userId: string, 
        userProfile: any, 
        pastResults: any, 
        continuationToken?: ContinuationToken | null
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }> {

        let completeWorkoutPlan: WorkoutPlan  = { 
            workout_program_description: "", 
            workout_plan_duration: "", 
            workout_plan_type: "", 
            workout_plan: [] 
        }
        let generatedDays = new Set<number>();
        let currentWeek = continuationToken?.currentWeek || 1; 
        let missingDays = continuationToken?.missingDays || Array.from({ length: 7 }, (_, i) => i + 1);
        let token: string | undefined = continuationToken?.token;

        const workoutSchemaJson = JSON.stringify(zodToJsonSchema(workoutResponseSchema, { name: "WorkoutPlanSchema" }));

        let periodization = {
            type: "concurrent",
            components: [
                { focus: "strength", intensity: "moderate-high", volume: "moderate" },
                { focus: "power", intensity: "high", volume: "low" },
                { focus: "metcon", intensity: "moderate", volume: "high" }
            ]
        }; 

        console.log(`missing days ${missingDays}`);
        const MAX_RETRIES = 3;
        const MAX_REQUESTS = 7 * 3;

        let requestCount = 0;
        let retries = 0;

        while (missingDays.length > 0 && requestCount < MAX_REQUESTS) {
            const initialPrompt = `You are a professional CrossFit coach designing structured, periodized workout plans in JSON format.

        Your task is to generate a well-balanced workout plan that is:

        - Customized to the user's background, fitness goals, available equipment, and training preferences.
        - Structured using periodization based on the type specified by the user (e.g., block, linear, undulating).
        - Inclusive of named CrossFit workouts (e.g., 'The Girls'), benchmark WODs, and randomly generated CrossFit-style workouts.
        - Designed for the athlete's age, weight, sex, fitness level, injury history, and incorporates exercises that may strengthen weaknesses (if possible).
        - Covering the full workout plan duration as specified by the user.
        - Following the user's requested workout frequency (days per week) and ensuring an even distribution of workouts.
        - Providing complete exercise details, including reps, weight percentage (if applicable), and scaling options.
        - Including a strength component where applicable and ensuring a well-defined workout of the day (WOD).
        - If requested by the workout options, include rest-days, warm-ups, main workouts, cooldowns, and post-workout recovery recommendations.
        - For rest-days, include the workout array field as empty.
        - If relevant, include benchmark workouts and track progress based on past results.
        - Include the workout plan description, duration, workout type or style, and a breakdown of each week's plan.

        When generating the workout plan:

        - If the response is truncated due to token limits, include a 'continuationToken' field at the root level of the JSON response.
        - The 'continuationToken' should be an object containing the following properties:
            - 'remainingWeeks': The number of weeks remaining in the workout plan.
            - 'nextWeek': The week number to be generated in the next request.
            - 'remainingDays':  The number of training days remaining in the current week.
           
            Only return a JSON object matching this schema. No explanations ${workoutSchemaJson}.
            Return a **fully populated** workout plan for week ${currentWeek} only.
            Return a **fully populated** day for the missing days ${missingDays.join(", ")} only.
            **DO NOT return a JSON schema reference ($ref)**. 
            **DO NOT describe the schema.** 
            **ONLY return valid JSON data.**
            **GUARANTEE that each day in the response adheres to the schema completely**
            **IF POSSIBLE, return more than 1 day to minimize follow up request for remaining days**

            User Profile: ${JSON.stringify(userProfile)} 
            Past Results: ${JSON.stringify(pastResults)} 
            Missing Days: ${missingDays.join(", ")}
            Periodization: ${JSON.stringify(periodization)}
            Continuation Token: ${token || ""}
            `;
            
            const followUpPrompt = `
                You are a professional CrossFit coach designing structured, periodized workout plans in JSON format.

                This is a follow-up request to generate the remaining workout plan based on the continuation token provided.

                - Customized to the user's background, fitness goals, available equipment, and training preferences.
                - Structured using periodization based on the type specified by the user (e.g., block, linear, undulating).
                - Inclusive of named CrossFit workouts (e.g., 'The Girls'), benchmark WODs, and randomly generated CrossFit-style workouts.
                - Designed for the athlete's age, weight, sex, fitness level, injury history, and incorporates exercises that may strengthen weaknesses (if possible).
                - Covering the full workout plan duration as specified by the user.
                - Following the user's requested workout frequency (days per week) and ensuring an even distribution of workouts.
                - Providing complete exercise details, including reps, weight percentage (if applicable), and scaling options.
                - Including a strength component where applicable and ensuring a well-defined workout of the day (WOD).
                - If requested by the workout options, include rest-days, warm-ups, main workouts, cooldowns, and post-workout recovery recommendations.
                - For rest-days, include the workout array field as empty.
                - If relevant, include benchmark workouts and track progress based on past results.
                - Include the workout plan description, duration, workout type or style, and a breakdown of each week's plan.

                Only return a JSON object matching this schema. No explanations ${workoutSchemaJson}.
                Return a **fully populated** workout plan for week ${currentWeek} only.
                Return a **fully populated** day for the missing days ${missingDays.join(", ")} only.
                **DO NOT return a JSON schema reference ($ref)**. 
                **DO NOT describe the schema.** 
                **ONLY return valid JSON data.**
                **GUARANTEE that each day in the response adheres to the schema completely**
                **IF POSSIBLE, return more than 1 day to minimize follow up request for remaining days**

                Continuation Token: ${token || ""} 
                User Profile: ${JSON.stringify(userProfile)} 
                Past Results: ${JSON.stringify(pastResults)} 
                Periodization: ${JSON.stringify(periodization)}
            `;

            let prompt = initialPrompt;

            if (missingDays.length < 7) {
                prompt = followUpPrompt;
            }
            
            console.log("Prompt:");
            console.log(prompt);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: prompt }],
                temperature: 0.7,
                max_tokens: 4096,
                response_format: {type: "json_object" }
            });
            
            if (!response.choices[0].message.content) {
                throw new Error("Invalid AI response");
            }

            const generatedPlan = JSON.parse(response.choices[0].message.content);
            token = response.usage?.completion_tokens?.toString();
            
            console.log("Generated Workout Plan:");
            console.log(JSON.stringify(generatedPlan, null, 2));

            // Validate response schema
            const validation = workoutResponseSchema.safeParse(generatedPlan);
            if (!validation.success) {
                retries++;
                console.warn(`Invalid AI response schema: ${validation.error}, retrying request ${retries}`);

                if (retries >= MAX_RETRIES) {
                    throw new Error("Failed to generate a valid workout plan");
                }
                requestCount++;
                continue;
            }

            // Merge the generated plan into completeWorkoutPlan
            if (!completeWorkoutPlan.workout_program_description) {
                completeWorkoutPlan.workout_program_description = generatedPlan.workout_program_description;
            }

            if (!completeWorkoutPlan.workout_plan_duration) {
                completeWorkoutPlan.workout_plan_duration = generatedPlan.workout_plan_duration;
            }

            if (!completeWorkoutPlan.workout_plan_type) {
                completeWorkoutPlan.workout_plan_type = generatedPlan.workout_plan_type;
            }
            
            generatedPlan.workout_plan.forEach((week: any) => {
                let existingWeek = completeWorkoutPlan.workout_plan.find(w => w.week === week.week);
                if (!existingWeek) {
                    completeWorkoutPlan.workout_plan.push({ ...week, days: [] });
                    existingWeek = completeWorkoutPlan.workout_plan.find(w => w.week === week.week);
                }

                week.days.forEach((day: any) => {
                    if (!generatedDays.has(day.day)) {
                        if (existingWeek) {
                            existingWeek.days.push(day);
                        }
                        generatedDays.add(day.day);
                    }
                });
            });
            missingDays = Array.from({ length: 7 }, (_, i) => i + 1).filter(day => !generatedDays.has(day));
            requestCount++;
            console.log(`missing days after processing results ${missingDays}, request count ${requestCount}`);
        }
        
        if (!completeWorkoutPlan) {
            throw new Error("Failed to generate a complete workout plan");
        }

        return { workoutPlan: completeWorkoutPlan, continuationToken: missingDays.length > 0 ? continuationToken: null };
    }
}
// Factory function to get the appropriate AI adapter
export function getWorkoutGenerator(): WorkoutAIAdapter {
    return new OpenAIWorkoutAdapter();
}