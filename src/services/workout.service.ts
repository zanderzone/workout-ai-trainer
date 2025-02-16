import { WorkoutPlan, WorkoutResult, GeneratedWorkoutPlan, aiWorkoutResponseSchema } from "../types/workout.types";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import dotenv from "dotenv";
// import { SafeParseReturnType } from "zod";
// import { saveWorkout } from "../services/database.service"; // Import the saveWorkout function
import { generateUuid } from "../utils/uuid";
import { WorkoutOptions } from "../types/workoutOptions.types";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export interface WorkoutAIAdapter {
    generateWorkout(userId: string,
        userProfile: any,
        pastResults: any,
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks?: number | null,
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }>;
    generateNewWeek(userId: string,
        workoutId: string,
        userProfile: any,
        pastResults: any,
        workoutOpts?: WorkoutOptions | null,
        currentWeek?: number,
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }>;
}

export interface WorkoutAIAdapterConstructor {
    new (uuidGenerator?: () => string): WorkoutAIAdapter;
}

export interface Periodization {
    type: string;
    components: Array<{ focus: string; intensity: string; volume: string }>;
}

export interface ContinuationToken {
    token: string;
    missingDays: number[];
    missingWeeks: number[];
    currentWeek?: number | null;
    nextWeek?: number | null;
}

export interface ResponseValidation {
    success: boolean;
    error?: string;
}

export function validateAiResponse(response: any): ResponseValidation {
    console.log("Validating AI response...");
    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
    const validationResult = aiWorkoutResponseSchema.safeParse(response);
    
    if (!validationResult.success) {
        console.error("AI Response Validation Error:", validationResult.error);
    }

    console.log(`Validation Result: ${JSON.stringify(validationResult, null, 2)}`);
    return {
        success: validationResult.success,
        error: validationResult.error?.message
    };
}

// Default implementation using OpenAI
export class OpenAIWorkoutAdapter implements WorkoutAIAdapter {
    private openai: OpenAI;
    private uuidGenerator: () => string;

    constructor(uuidGenerator: () => string = generateUuid) {
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        this.uuidGenerator = uuidGenerator; // Store injected UUID function
    }

    async generateNewWeek(
        userId: string,
        workoutId: string, // ID of the existing workout plan
        userProfile: any,
        pastResults: WorkoutResult[],
        workoutOpts: WorkoutOptions | null,
        currentWeek: number, // Current week number
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }> {

        let continuationToken: ContinuationToken | null = {
            token: workoutId,
            missingDays: [1, 2, 3, 4, 5, 6, 7],
            missingWeeks: [],
            currentWeek: currentWeek,
            nextWeek: currentWeek + 1
        };

        // Generate the next week's workout
        const nextWeek = currentWeek + 1;
        const newWeekWorkout = await this.generateWorkout(
            userId, userProfile, pastResults, continuationToken, workoutOpts, currentWeek + 1 
        );

        return {
            workoutPlan: newWeekWorkout.workoutPlan,
            continuationToken: newWeekWorkout.continuationToken
        };
    }
    async generateWorkout(
        userId: string,
        userProfile: any,
        pastResults: WorkoutResult[],
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks: number = 1 // Default to 1 week if not provided
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }> {
    
        console.log("Generating workout plan...");
        let workoutId = continuationToken?.token || this.uuidGenerator();
        let newWorkoutPlan: WorkoutPlan = {
            id: workoutId,
            workoutProgramDescription: "",
            workoutPlanDuration: "",
            workoutPlanType: "",
            workoutPlan: []
        };
        
        console.log("Workout ID:", workoutId);
        console.log("Continuation Token:", continuationToken);

        let generatedWeeks = new Set<number>();
        let generatedDays = new Set<number>();
    
        // Start from the current week in the continuationToken if available; otherwise, start from week 1
        let currentWeek = continuationToken?.currentWeek || 1;
        let token: string | undefined = continuationToken?.token;
    
        // Generate a range of weeks starting from `currentWeek` for `numWeeks`
        let weeksToGenerate = Array.from({ length: numWeeks }, (_, i) => currentWeek + i);
    
        // const workoutSchemaJson = JSON.stringify(zodToJsonSchema(aiWorkoutResponseSchema, { name: "GeneratedWorkoutPlanSchema" }));
        const workoutSchemaJson = JSON.stringify(zodToJsonSchema(aiWorkoutResponseSchema));
    
        const MAX_RETRIES = 3;
        const MAX_REQUESTS = 7 * numWeeks;
    
        let requestCount = 0;
        let retries = 0;
    
        let newContinuationToken: ContinuationToken = {
            token: "",
            missingDays: [],
            missingWeeks: [],
            currentWeek: null,
            nextWeek: null
        };
    
        for (const week of weeksToGenerate) {
            let missingDays = Array.from({ length: 7 }, (_, i) => i + 1); // Reset missing days for each week
    
            while (missingDays.length > 0 && requestCount < MAX_REQUESTS) {
                const prompt = `
You are a professional CrossFit coach generating structured, periodized workout plans in JSON.

## **Workout Plan Requirements**
- Customize for **fitness goals, experience, equipment, injury history**.
- **Periodized structure**: strength, conditioning, recovery.
- If applicable for the phase, include **CrossFit benchmarks workout** (‘The Girls’), randomized WODs.
- Consider **age, weight, sex, past performance** for personalization.
- Ensure **even distribution** across user-specified training days.
- Provide **exercise details**: reps, weight %, scaling.
- Include **strength focus** (where applicable) & a clear WOD.
- Add **rest days, warm-ups, cooldowns, recovery recommendations** (if requested).
- **Rest days** must contain an empty workout array.
- Track **progress with benchmarks** based on past results.

## **Response Structure**
- **ONLY return a JSON object matching this schema. No explanations** ${workoutSchemaJson}.
- Always return a **fully populated workout plan** for **week ${currentWeek}**.
- Include **days only for ${missingDays.join(", ")}**.
- Always include the ContinuationToken per response that describes the current week(s), remaining weeks, days, and the next week to generate.
- **DO NOT return schema references ($ref) or descriptions.**
- **ONLY return valid JSON matching the schema.**
- If the periodization phase is "benchmark" and/or "testing", include a Crossfit benchmark workouts in the phase.
- Use Wave-load intensity progression for strength training.
- Ensure the end of the workout plan has a clear deload phase.
- Include a skill-focused session for gymnastics or weightlifting.
- Structure and describe active recovery clearly.
- **ALWAYS** Include a 'continuationToken' object as specified in the Schema with token, currentWeek, missingWeeks (The weeks that have not been requeseted), missingDays (empty array if all days have been included) and nextWeek (if not the last week).

## **User Inputs**
- **User Profile:** ${JSON.stringify(userProfile)}
- **Past Results:** ${JSON.stringify(pastResults)}
- **Workout Options:** ${JSON.stringify(workoutOpts)}
- **Missing Days:** ${missingDays.join(", ")}
- **Continuation Token:** ${token || ""}
                `
    
                console.log("Prompt:");
                console.log(prompt);
    
                const response = await this.openai.chat.completions.create({
                    model: "gpt-4-turbo",
                    messages: [{ role: "system", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 4096,
                    response_format: { type: "json_object" }
                });
    
                if (!response.choices[0].message.content) {
                    throw new Error("Invalid AI response");
                }
                console.log("Response:");
                const generatedPlan = JSON.parse(response.choices[0].message.content);
                // token = response.usage?.completion_tokens?.toString() || generatedPlan.continuationToken?.token.toString();
                token = generatedPlan.continuationToken?.token || response.usage?.completion_tokens?.toString() || continuationToken?.token || generateUuid();
                console.log("Token:", token);
    
                console.log("Generated Workout Plan:");
                console.log(JSON.stringify(generatedPlan, null, 2));
    
                // Validate response schema
                let validation = validateAiResponse(generatedPlan);
                console.log(`Validation Result: ${JSON.stringify(validation, null, 2)}`);
    
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
                if (!newWorkoutPlan.workoutProgramDescription) {
                    newWorkoutPlan.workoutProgramDescription = generatedPlan.workoutProgramDescription;
                }
    
                if (!newWorkoutPlan.workoutPlanDuration) {
                    newWorkoutPlan.workoutPlanDuration = generatedPlan.workoutPlanDuration;
                }
    
                if (!newWorkoutPlan.workoutPlanType) {
                    newWorkoutPlan.workoutPlanType = generatedPlan.workoutPlanType;
                }
                console.log("Merge results into generated plan...");
                generatedPlan.workoutPlan.forEach((weekPlan: any) => {
                    let existingWeek = newWorkoutPlan.workoutPlan.find((w) => w.week === weekPlan.week);
    
                    if (!existingWeek) {
                        newWorkoutPlan.workoutPlan.push({ ...weekPlan, days: [] });
                        existingWeek = newWorkoutPlan.workoutPlan.find((w) => w.week === weekPlan.week);
                    }
    
                    weekPlan.days.forEach((day: any) => {
                        if (!generatedDays.has(day.day)) {
                            if (existingWeek) {
                                existingWeek.days.push(day);
                            }
                            generatedDays.add(day.day);
                        }
                    });
                });

                missingDays = Array.from({ length: 7 }, (_, i) => i + 1).filter(day => !generatedDays.has(day));
    
                if (generatedPlan.continuationToken) {
                    newContinuationToken = {
                        token: token && token !== "" ? token : continuationToken?.token || generateUuid(), // Ensure valid token
                        missingDays: missingDays,
                        missingWeeks: generatedPlan.continuationToken?.missingWeeks || [],
                        currentWeek: generatedPlan.continuationToken?.currentWeek || continuationToken?.currentWeek || 1,
                        nextWeek: generatedPlan.continuationToken?.nextWeek || continuationToken?.nextWeek || 2
                    };
                }
    
                requestCount++;
                console.log(`Generated Plan: ${JSON.stringify(generatedPlan, null, 2)}`);

            }
    
            generatedWeeks.add(week);
        }
    
        if (!newWorkoutPlan) {
            throw new Error("Failed to generate a complete workout plan");
        }
    
        return { workoutPlan: newWorkoutPlan, continuationToken: newContinuationToken };
    }
}


// Factory function to get the appropriate AI adapter
export function getWorkoutGenerator(
    provider: "openai" = "openai",
    uuidGenerator: () => string = generateUuid
): WorkoutAIAdapter {
    switch (provider) {
        case "openai":
            return new OpenAIWorkoutAdapter(uuidGenerator);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}