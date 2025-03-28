import { AiWodSchema, Wod, aiWodResponseSchema } from "../types/wod.types";
import { WodAIAdapter } from "../types/wodAiAdapter.types";
import OpenAI from "openai";
import dotenv from "dotenv";
import { generateUuid } from "../utils/uuid";
import { WorkoutOptions } from "../types/workoutOptions.types";
import { UserProfile } from "../types/userProfile.types";
import { validateSystemPrompt, validateUserPrompt } from "../prompts/prompt-utils";
import { generateSystemPrompt } from "../prompts/system-prompt";
import { generateUserPrompt } from "../prompts/user-prompt";
import { Collection } from "mongodb";
import { WodType, wodValidationSchema } from "../types/wod.types";
import { BaseService } from "./base.service";
import { DatabaseError, handleDatabaseError } from "../errors";
import { handleOpenAIError, OpenAIResponseError, OpenAIInvalidRequestError } from "../errors";
import { withRetry } from "../utils/openai-retry";
import { OpenAIRateLimiter } from "../utils/openai-retry";
import { enhancedWodValidationSchema } from "../validation/workout.validation";

dotenv.config();

export class OpenAIWorkoutAdapter implements WodAIAdapter {
    private openai: OpenAI;
    private uuidGenerator: () => string;
    private rateLimiter: OpenAIRateLimiter;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.uuidGenerator = generateUuid;
        this.rateLimiter = new OpenAIRateLimiter();
    }

    async generateWod(
        userId: string,
        userProfile: UserProfile,
        workoutOpts?: WorkoutOptions | null,
    ): Promise<{ wod: AiWodSchema }> {
        console.log("Generating WOD...");
        let wodId = this.uuidGenerator();

        const systemPrompt = generateSystemPrompt();
        const userPrompt = generateUserPrompt(userProfile, workoutOpts);

        if (!validateSystemPrompt(systemPrompt) || !validateUserPrompt(userPrompt)) {
            throw new OpenAIInvalidRequestError("Invalid prompt generated");
        }

        console.log("System Prompt:", systemPrompt);
        console.log("User Prompt:", userPrompt);

        try {
            // Wait for rate limit before making the request
            await this.rateLimiter.waitForRateLimit();

            // Use retry logic for the API call
            const response = await withRetry(async () => {
                return await this.openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 1.0,
                    max_tokens: 4096,
                    response_format: { type: "json_object" }
                });
            });

            if (!response.choices[0].message.content) {
                throw new OpenAIResponseError("Empty response from OpenAI");
            }

            let generatedWod;
            try {
                generatedWod = JSON.parse(response.choices[0].message.content);
            } catch (parseError) {
                throw new OpenAIResponseError("Failed to parse OpenAI response", parseError);
            }

            // Validate the generated WOD against our enhanced schema
            const validationResult = aiWodResponseSchema.safeParse(generatedWod);
            if (!validationResult.success) {
                throw new OpenAIResponseError(
                    "Invalid WOD format received from OpenAI",
                    validationResult.error
                );
            }

            // Return the validated WOD with the correct structure
            return { wod: validationResult.data };
        } catch (error) {
            console.error("Error generating WOD:", error);
            handleOpenAIError(error);
        }
    }
}

export function getWodGenerator(
    provider: "openai" = "openai",
    uuidGenerator: () => string = generateUuid
): WodAIAdapter {
    switch (provider) {
        case "openai":
            return new OpenAIWorkoutAdapter();
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

export class WodService extends BaseService<WodType> {
    constructor(collection: Collection<WodType>) {
        super(collection);
    }

    async saveWod(wod: AiWodSchema, userId: string): Promise<WodType> {
        try {
            const wodWithMetadata: WodType = {
                ...wod.wod,
                wodId: generateUuid(),
                userId,
                description: wod.description,
                warmup: wod.wod.warmup || {
                    type: "General Warmup",
                    duration: "10 minutes",
                    activities: []
                },
                cooldown: wod.wod.cooldown || {
                    type: "General Cooldown",
                    duration: "10 minutes",
                    activities: []
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validate against enhanced schema before saving
            const validatedWod = enhancedWodValidationSchema.parse(wodWithMetadata);
            return await this.createWithValidation(validatedWod, wodValidationSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to save WOD", error);
        }
    }

    async getWod(wodId: string): Promise<WodType | null> {
        const wod = await this.findOne({ wodId });
        if (wod) {
            // Validate against enhanced schema before returning
            const validatedWod = enhancedWodValidationSchema.parse(wod);
            return validatedWod;
        }
        return null;
    }

    async getUserWods(userId: string): Promise<WodType[]> {
        const wods = await this.find({ userId });
        // Validate each WOD against enhanced schema
        return wods.map(wod => enhancedWodValidationSchema.parse(wod));
    }

    async updateWod(wodId: string, wod: Partial<WodType>): Promise<WodType | null> {
        const updateData = {
            ...wod,
            updatedAt: new Date()
        };

        // Validate against enhanced schema before updating
        const validatedWod = enhancedWodValidationSchema.partial().parse(updateData);
        return this.updateWithValidation({ wodId }, validatedWod, wodValidationSchema);
    }
}
