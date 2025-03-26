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

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export class OpenAIWorkoutAdapter implements WodAIAdapter {
    private openai: OpenAI;
    private uuidGenerator: () => string;

    constructor(uuidGenerator: () => string = generateUuid) {
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        this.uuidGenerator = uuidGenerator;
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
            throw new Error("Invalid prompt generated");
        }

        console.log("System Prompt:", systemPrompt);
        console.log("User Prompt:", userPrompt);

        try {
            // TODO: Add rate limiting
            // TODO: Add retry logic
            // TODO: Add timeout logic
            // TODO: Add batching logic
            // TODO: Add caching logic

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 1.0,
                max_tokens: 4096,
                response_format: { type: "json_object" }
            });

            if (!response.choices[0].message.content) {
                throw new Error("Empty response from OpenAI");
            }

            const generatedWod = JSON.parse(response.choices[0].message.content);

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
            throw error;
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
