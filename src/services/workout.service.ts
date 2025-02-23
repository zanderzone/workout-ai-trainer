import {WorkoutPlan, WorkoutResult, aiWorkoutResponseSchema} from "../types/workout.types";
import {zodToJsonSchema} from "zod-to-json-schema";
import OpenAI from "openai";
import dotenv from "dotenv";
import {generateUuid} from "../utils/uuid";
import {WorkoutOptions} from "../types/workoutOptions.types";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export interface ContinuationToken {
    token: string;
    missingDays: number[];
    missingWeeks: number[];
    currentWeek?: number | null;
    nextWeek?: number | null;
}

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

export function validateAiResponse(response: any): { success: boolean; error?: string } {
    console.log("Validating AI response...");
    const validationResult = aiWorkoutResponseSchema.safeParse(response);
    if (!validationResult.success) {
        console.error("AI Response Validation Error:", validationResult.error);
    }
    return {
        success: validationResult.success,
        error: validationResult.error?.message
    };
}

export class OpenAIWorkoutAdapter implements WorkoutAIAdapter {
    private openai: OpenAI;
    private uuidGenerator: () => string;

    constructor(uuidGenerator: () => string = generateUuid) {
        this.openai = new OpenAI({apiKey: OPENAI_API_KEY});
        this.uuidGenerator = uuidGenerator;
    }

    async generateWorkout(
        userId: string,
        userProfile: any,
        pastResults: WorkoutResult[],
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks: number = 1
    ): Promise<{ workoutPlan: WorkoutPlan; continuationToken?: ContinuationToken | null }> {

        console.log("Generating workout plan...");
        let workoutId = continuationToken?.token || this.uuidGenerator();
        let currentWeek = continuationToken?.currentWeek ?? 1;
        let weeksToGenerate = Array.from({length: numWeeks}, (_, i) => currentWeek + i);
        let token = continuationToken?.token || workoutId;
        let generatedDays = new Set<number>();

        let newWorkoutPlan: WorkoutPlan = {
            id: workoutId,
            workoutProgramDescription: "",
            workoutPlanDuration: "",
            workoutPlanType: "",
            workoutPlan: []
        };

        for (const week of weeksToGenerate) {
            let missingDays = Array.from({length: 7}, (_, i) => i + 1);
            let prompt = this.createPrompt(week, missingDays, userProfile, pastResults, workoutOpts, token);

            try {
                const response = await this.openai.chat.completions.create({
                    model: "gpt-4-turbo",
                    messages: [{role: "system", content: prompt}],
                    temperature: 0.7,
                    max_tokens: 4096,
                    response_format: {type: "json_object"}
                });

                if (!response.choices[0].message.content) {
                    throw new Error("AI response was empty");
                }

                const generatedPlan = JSON.parse(response.choices[0].message.content);
                token = generatedPlan.continuationToken?.token || token;
                this.mergeWorkoutPlan(newWorkoutPlan, generatedPlan, generatedDays);
            } catch (error) {
                console.error("OpenAI API Call Failed:", error);
                throw new Error("Workout generation failed due to AI service error.");
            }
        }

        return {
            workoutPlan: newWorkoutPlan,
            continuationToken: {
                token,
                missingDays: [],
                missingWeeks: [],
                currentWeek,
                nextWeek: currentWeek + numWeeks
            }
        };
    }

    private createPrompt(
        week: number,
        missingDays: number[],
        userProfile: any,
        pastResults: WorkoutResult[],
        workoutOpts: WorkoutOptions | null | undefined,
        token: string
    ): string {
        const schemaJson = JSON.stringify(zodToJsonSchema(aiWorkoutResponseSchema));
        return `You are a professional CrossFit coach generating structured, periodized workout plans in JSON.

        ## **Workout Plan Requirements**
        - Customize for **fitness goals, experience, equipment, injury history**.
        - **Periodized structure**: strength, conditioning, recovery.
        - If applicable for the phase, include **CrossFit benchmarks**.
        - Ensure **even distribution** across user-specified training days.
        - Provide **exercise details**: reps, weight %, scaling.
        - Always return a **fully populated workout plan** for **week ${week}**.
        - Include **days only for ${missingDays.join(", ")}**.
        - Include a 'continuationToken' with token, currentWeek, missingWeeks, missingDays, and nextWeek.

        ## **User Inputs**
        - **User Profile:** ${JSON.stringify(userProfile)}
        - **Past Results:** ${JSON.stringify(pastResults)}
        - **Workout Options:** ${JSON.stringify(workoutOpts)}
        - **Continuation Token:** ${token}`;
    }

    private mergeWorkoutPlan(newWorkoutPlan: WorkoutPlan, generatedPlan: any, generatedDays: Set<number>) {
        if (!newWorkoutPlan.workoutProgramDescription) {
            newWorkoutPlan.workoutProgramDescription = generatedPlan.workoutProgramDescription;
        }
        if (!newWorkoutPlan.workoutPlanDuration) {
            newWorkoutPlan.workoutPlanDuration = generatedPlan.workoutPlanDuration;
        }
        if (!newWorkoutPlan.workoutPlanType) {
            newWorkoutPlan.workoutPlanType = generatedPlan.workoutPlanType;
        }

        generatedPlan.workoutPlan.forEach((weekPlan: any) => {
            let existingWeek = newWorkoutPlan.workoutPlan.find((w) => w.week === weekPlan.week);
            if (!existingWeek) {
                newWorkoutPlan.workoutPlan.push({...weekPlan, days: []});
                existingWeek = newWorkoutPlan.workoutPlan.find((w) => w.week === weekPlan.week);
            }
            weekPlan.days.forEach((day: any) => {
                if (!generatedDays.has(day.day)) {
                    existingWeek?.days.push(day);
                    generatedDays.add(day.day);
                }
            });
        });
    }
}

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
