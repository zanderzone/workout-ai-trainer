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

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export class OpenAIWorkoutAdapter implements WodAIAdapter {
    private openai: OpenAI;
    private uuidGenerator: () => string;
    private rateLimiter: OpenAIRateLimiter;

    constructor(uuidGenerator: () => string = generateUuid) {
        if (!OPENAI_API_KEY) {
            throw new Error("OpenAI API key is not configured");
        }
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        this.uuidGenerator = uuidGenerator;
        this.rateLimiter = new OpenAIRateLimiter(60); // 60 requests per minute
    }

    async generateWod(
        userId: string,
        userProfile: UserProfile,
        workoutOpts?: WorkoutOptions | null,
    ): Promise<{ wod: Wod }> {
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

            // Validate the generated WOD against our schema
            const validationResult = aiWodResponseSchema.safeParse(generatedWod);
            if (!validationResult.success) {
                throw new OpenAIResponseError(
                    "Invalid WOD format received from OpenAI",
                    validationResult.error
                );
            }

            // Add MongoDB required fields
            const wod: Wod = {
                ...generatedWod,
                _id: wodId,
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            return { wod };
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
            return new OpenAIWorkoutAdapter(uuidGenerator);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

export class WodService extends BaseService<WodType> {
    constructor(collection: Collection<WodType>) {
        super(collection);
    }

    async saveWod(wod: Omit<WodType, '_id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<WodType> {
        try {
            const wodWithMetadata: WodType = {
                ...wod,
                wodId: generateUuid(),
                userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            return await this.createWithValidation(wodWithMetadata, wodValidationSchema);
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            throw new DatabaseError("Failed to save WOD", error);
        }
    }

    async getWod(wodId: string): Promise<WodType | null> {
        return this.findOne({ wodId });
    }

    async getUserWods(userId: string): Promise<WodType[]> {
        return this.find({ userId });
    }

    async updateWod(wodId: string, wod: Partial<Omit<WodType, '_id' | 'createdAt' | 'updatedAt'>>): Promise<WodType | null> {
        const updateData = {
            ...wod,
            updatedAt: new Date()
        };

        return this.updateWithValidation({ wodId }, updateData, wodValidationSchema);
    }
}
