/* eslint-disable */
// @ts-nocheck
// This file is part of the future workout feature and is temporarily disabled

import { WorkoutPlanDB, WorkoutResult, aiWorkoutResponseSchema } from "../types/workout.types";
import { zodToJsonSchema } from "zod-to-json-schema";
import OpenAI from "openai";
import dotenv from "dotenv";
import { generateUuid } from "../utils/uuid";
import { WorkoutOptions } from "../types/workoutOptions.types";
import { ContinuationToken } from "../types/continuationToken.types";
import { WorkoutAIAdapter } from "../types/workoutAiAdapter.types";
import { Collection, ObjectId } from "mongodb";
import { BaseService } from "./base.service";
import { DatabaseError } from "../utils/error-handling";
import { workoutPlanDBSchema } from "../types/workout.types";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

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
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        this.uuidGenerator = uuidGenerator;
    }

    async generateWorkout(
        userId: string,
        userProfile: any,
        pastResults: WorkoutResult[],
        continuationToken?: ContinuationToken | null,
        workoutOpts?: WorkoutOptions | null,
        numWeeks: number = 1
    ): Promise<{ workoutPlan: WorkoutPlanDB; continuationToken?: ContinuationToken | null }> {

        console.log("Generating workout plan...");
        let workoutId = continuationToken?.token || this.uuidGenerator();
        let currentWeek = continuationToken?.currentWeek ?? 1;
        let weeksToGenerate = Array.from({ length: numWeeks }, (_, i) => currentWeek + i);
        let token = continuationToken?.token || workoutId;
        let generatedDays = new Set<number>();

        let newWorkoutPlan: WorkoutPlanDB = {
            id: workoutId,
            workoutProgramDescription: "",
            workoutPlanDuration: "",
            workoutPlanType: "",
            workoutPlan: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        for (const week of weeksToGenerate) {
            let missingDays = Array.from({ length: 7 }, (_, i) => i + 1);
            let prompt = this.createPrompt(week, missingDays, userProfile, pastResults, workoutOpts, token);

            console.log(`Generating week ${week}...prompt: ${prompt}`);
            try {
                const response = await this.openai.chat.completions.create({
                    model: "gpt-4-turbo",
                    messages: [{ role: "system", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 4096,
                    response_format: { type: "json_object" }
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
        -**Ensure that the response matches the schema:** ${schemaJson}**
        - Customize for **fitness goals, experience, available equipment, injury history**.
        - **Periodized structure**: strength, conditioning, recovery.
        - If applicable for the phase, include **CrossFit benchmarks**.
        - Include gymnastics, weightlifting, limited unilateral work, core-focused, monostructural exercises where applicable in the phase.
        - Ensure **even distribution** across user-specified training days.
        - Ensure **exercise details**: reps, weight %, scaling.
        - Ensure **clear round/time structure** (e.g., "EMOM 15 Min: Rowing, Wall Balls, Burpees").
        - Always return a **fully populated workout plan** for **week ${week}**.
        - Ensure workout days are not repetative but follow Crossfit philosophy of **constantly varied functional movements**.
        - Include **days only for ${missingDays.join(", ")}**.
        - Include a 'continuationToken' with token, currentWeek, missingWeeks, missingDays, and nextWeek.

        ## **User Inputs**
        - **User Profile:** ${JSON.stringify(userProfile), null, 2}
        - **Past Results:** ${JSON.stringify(pastResults), null, 2}
        - **Workout Options:** ${JSON.stringify(workoutOpts), null, 2}
        - **Continuation Token:** ${token}`;
    }

    private mergeWorkoutPlan(newWorkoutPlan: WorkoutPlanDB, generatedPlan: any, generatedDays: Set<number>) {
        if (!generatedPlan || !Array.isArray(generatedPlan.workoutPlan)) {
            console.error("Invalid AI response: workoutPlan is not an array", generatedPlan);
            throw new Error("Invalid AI response format: workoutPlan should be an array");
        }

        if (!newWorkoutPlan.workoutProgramDescription) {
            newWorkoutPlan.workoutProgramDescription = generatedPlan.workoutProgramDescription || "";
        }
        if (!newWorkoutPlan.workoutPlanDuration) {
            newWorkoutPlan.workoutPlanDuration = generatedPlan.workoutPlanDuration || "";
        }
        if (!newWorkoutPlan.workoutPlanType) {
            newWorkoutPlan.workoutPlanType = generatedPlan.workoutPlanType || "";
        }

        generatedPlan.workoutPlan.forEach((weekPlan: any) => {
            if (!weekPlan || typeof weekPlan !== "object" || !Array.isArray(weekPlan.days)) {
                console.error("Invalid week plan format", weekPlan);
                return; // Skip invalid week plans
            }

            let existingWeek = newWorkoutPlan.workoutPlan.find((w) => w.week === weekPlan.week);
            if (!existingWeek) {
                newWorkoutPlan.workoutPlan.push({ ...weekPlan, days: [] });
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

export class WorkoutService extends BaseService<WorkoutPlanDB> {
    constructor(collection: Collection<WorkoutPlanDB>) {
        super(collection);
    }

    async saveWorkout(workout: Omit<WorkoutPlanDB, '_id' | 'createdAt' | 'updatedAt'>, workoutId?: string): Promise<WorkoutPlanDB> {
        try {
            const workoutWithMetadata: WorkoutPlanDB = {
                ...workout,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (workoutId) {
                workoutWithMetadata._id = new ObjectId(workoutId);
            }

            return await this.createWithValidation(workoutWithMetadata, workoutPlanDBSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to save workout", error);
        }
    }

    async getWorkout(workoutId: string): Promise<WorkoutPlanDB | null> {
        try {
            return await this.findOne({ _id: new ObjectId(workoutId) });
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to get workout", error);
        }
    }

    async getUserWorkouts(userId: string): Promise<WorkoutPlanDB[]> {
        try {
            return await this.find({ userId });
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to get user workouts", error);
        }
    }

    async updateWorkout(workoutId: string, workout: Partial<Omit<WorkoutPlanDB, '_id' | 'createdAt' | 'updatedAt'>>): Promise<WorkoutPlanDB | null> {
        try {
            const updateData = {
                ...workout,
                updatedAt: new Date()
            };

            return await this.updateWithValidation(
                { _id: new ObjectId(workoutId) },
                updateData,
                workoutPlanDBSchema
            );
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to update workout", error);
        }
    }
}
