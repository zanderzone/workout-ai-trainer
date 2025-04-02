import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import { WodAIAdapter, WodResponse, WodTypeRecommendation } from "../types/wod.types";
import { FitnessProfile } from "../types/fitnessProfile.types";
import { WorkoutRequest } from "../types/workoutRequest.types";
import { OpenAI } from "openai";
import { formatWorkoutOverview } from '../utils/workout.utils';
import { validateWorkoutRequest, createBaseWorkoutRequest, constructWod } from '../utils/wod.utils';
import { InvalidAIResponseError, WodGenerationError } from '../errors/wod.errors';

export class OpenAIWorkoutAdapter implements WodAIAdapter {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    private getSystemPrompt(): string {
        return `You are an elite fitness coach with the following qualifications and experience:

    Professional Background:
    - 15+ years of CrossFit coaching experience
    - CrossFit Level 4 Certified Coach (CCFC)
    - Former collegiate track and field sprinter specializing in 100m and 200m events
    - Former Division I rugby player with 8 years of competitive experience
    
    Additional Certifications:
    - NSCA Certified Strength and Conditioning Specialist (CSCS)
    - USA Weightlifting Level 2 Coach
    - Precision Nutrition Level 2 Certified Coach
    - Functional Movement Systems (FMS) Level 2
    - Training Think Tank Programming Certification
    
    Coaching Experience:
    - Extensive experience coaching all levels from beginners to elite competitive athletes
    - Specialized in developing personalized training programs considering individual goals, limitations, and equipment availability
    - Expert in movement mechanics and scaling options for all primary CrossFit movements
    - Deep understanding of proper progression and regression of complex movements
    - Proficient in programming for both general fitness and sport-specific performance
    
    When creating workouts, you:
    1. Prioritize proper movement patterns and safety
    2. Consider the athlete's current fitness level and limitations
    3. Provide detailed scaling options for movements when appropriate
    4. Include clear instructions for proper form and movement standards
    5. Design workouts that align with the athlete's goals while maintaining variety and engagement
    6. Structure appropriate warm-ups and cool-downs specific to the workout's demands
    
    You must respond only with a valid JSON object following the exact structure specified in the user's prompt.`;
    }

    async generateWod(
        userId: string,
        fitnessProfile?: FitnessProfile,
        workoutRequest?: WorkoutRequest
    ): Promise<WodResponse> {
        try {
            console.log('Starting WOD generation for user:', userId);

            if (!fitnessProfile) {
                throw new WodGenerationError("Fitness profile is required to generate a WOD");
            }

            // Get workout overview and determine workout type
            const workoutOverview = formatWorkoutOverview([], fitnessProfile);
            const workoutTypeRecommendation = await this.determineWorkoutType(
                workoutOverview,
                fitnessProfile
            );
            console.log('Workout type recommendation:', workoutTypeRecommendation);

            // Create and validate workout request
            const baseRequest = createBaseWorkoutRequest(userId);
            const validatedRequest = validateWorkoutRequest({
                ...baseRequest,
                ...workoutRequest,
                workoutType: workoutTypeRecommendation.workoutType,
                wodDuration: workoutTypeRecommendation.durationRange,
                intensity: workoutTypeRecommendation.intensity
            });

            // Generate WOD using OpenAI
            const aiResponse = await this.generateWodWithAI(fitnessProfile, validatedRequest);
            console.log('AI Response received');

            // Construct and validate WOD
            const wod = constructWod(userId, aiResponse, workoutTypeRecommendation.workoutType);
            console.log('Generated WOD:', wod);

            return { wod };
        } catch (error) {
            console.error('Error generating WOD:', error);
            throw error instanceof WodGenerationError ? error : new WodGenerationError('Failed to generate WOD', error);
        }
    }

    async determineWorkoutType(
        workoutOverview: string,
        fitnessProfile: FitnessProfile
    ): Promise<WodTypeRecommendation> {
        const prompt = `Based on the following workout overview and fitness profile, determine the most appropriate workout type and duration range for the next workout.

Workout Overview:
${workoutOverview}

Fitness Profile:
${JSON.stringify(fitnessProfile, null, 2)}

Please recommend:
1. The most appropriate workout type (AMRAP, EMOM, For Time, etc.)
2. A suitable duration range (e.g., "10 to 20 minutes")
3. The intensity level (low, medium, high)
4. The primary focus/goal of the workout (must be one of: "Strength", "Conditioning", "Strength & Conditioning", "Mobility", "Endurance", "Athletic Performance", "Competitive Performance")

Consider:
- The user's fitness level (${fitnessProfile.fitnessLevel})
- Their available equipment
- Their goals and preferences
- The time of day (${new Date().toISOString()})
- Their age range (${fitnessProfile.ageRange || 'not specified'})
- Their sex (${fitnessProfile.sex || 'not specified'})

Respond in JSON format with the following structure:
{
    "workoutType": "string",
    "durationRange": "string",
    "intensity": "string",
    "focus": "string (must be one of: Strength, Conditioning, Strength & Conditioning, Mobility, Endurance, Athletic Performance, Competitive Performance)"
}`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: this.getSystemPrompt() },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            });

            const result = JSON.parse(response.choices[0].message.content || '{}');
            return {
                workoutType: result.workoutType || 'AMRAP',
                durationRange: result.durationRange || '15 to 20 minutes',
                intensity: result.intensity || 'medium',
                focus: result.focus || 'Strength & Conditioning'
            };
        } catch (error) {
            console.error('Error determining workout type:', error);
            throw new Error('Failed to determine workout type');
        }
    }

    async generateWodWithAI(
        fitnessProfile: FitnessProfile,
        workoutRequest: WorkoutRequest
    ): Promise<any> {
        try {
            const prompt = this.createPrompt(fitnessProfile, workoutRequest);
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt()
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8
            });

            const content = completion.choices[0].message.content;
            if (!content) {
                throw new InvalidAIResponseError("No content in OpenAI response");
            }

            try {
                return JSON.parse(content);
            } catch (error) {
                throw new InvalidAIResponseError("Failed to parse AI response: Invalid JSON");
            }
        } catch (error) {
            if (error instanceof InvalidAIResponseError) {
                throw error;
            }
            throw new WodGenerationError("Failed to generate WOD with OpenAI", error);
        }
    }

    createPrompt(fitnessProfile: FitnessProfile, workoutRequest: WorkoutRequest): string {
        return `You are an expert CrossFit and fitness trainer AI. Your task is to create a personalized workout of the day (WOD) based on the user's fitness profile and specific workout request.

User's Fitness Profile:
${JSON.stringify(fitnessProfile, null, 2)}

Workout Request:
${JSON.stringify(workoutRequest, null, 2)}

Create a personalized WOD that:
1. Matches the user's fitness level and goals
2. Uses available equipment
3. Considers any injuries or limitations
4. Follows the requested workout type and duration
5. Includes appropriate scaling options

Important Notes:
- For bodyweight exercises (like pull-ups, push-ups, air squats, etc.), use '0' for the weight field
- For weighted exercises, specify the weight in pounds (e.g., '135' for barbell movements)
- Ensure all exercises have a weight value, even if it's '0' for bodyweight movements

Respond with a JSON object that follows this exact structure:
${JSON.stringify(this.getWodSchemaShape(), null, 2)}

Important:
- Ensure all exercises are appropriate for the user's fitness level
- Include detailed scaling options for each exercise
- Provide clear instructions for form and technique
- Consider the user's available equipment
- Account for any injuries or limitations
- Make the workout challenging but achievable
- Include appropriate rest periods
- Provide recovery recommendations`;
    }

    private createWorkoutTypePrompt(workoutOverview: string, fitnessProfile: FitnessProfile): string {
        return `${this.getSystemPrompt()}

Context:
${workoutOverview}

Fitness Profile:
- Level: ${fitnessProfile.fitnessLevel}
- Goals: ${fitnessProfile.goals.join(', ')}
- Location: ${fitnessProfile.locationPreference}
- Preferred Duration: ${fitnessProfile.preferredWorkoutDuration}

Available Equipment:
${fitnessProfile.availableEquipment.map(item => `- ${item}`).join('\n')}

Based on this information, recommend a CrossFit-style workout type that will:
1. Align with the athlete's goals and fitness level
2. Use available equipment effectively
3. Provide appropriate progression or variation from previous workouts
4. Match the preferred duration

Provide your recommendation in the following JSON format:
{
    "type": "The recommended workout type (must be one of: 'AMRAP', 'EMOM', 'For Time', 'Tabata', 'Ladder', 'RFT', 'Chipper', 'Death By', 'Complex')",
    "reasoning": "Detailed explanation of why this workout type is recommended, including how it aligns with CrossFit principles",
    "focus": "Primary focus of the workout (e.g., 'Metabolic Conditioning', 'Strength & Conditioning', 'Gymnastics & Conditioning', 'Olympic Weightlifting')",
    "duration": "Recommended duration in minutes",
    "intensity": "Recommended intensity level (must be one of: 'moderate', 'high', 'recovery')"
}

Note: The workout type should follow standard CrossFit terminology and formats. For example:
- AMRAP (As Many Rounds As Possible)
- EMOM (Every Minute On the Minute)
- For Time (complete work as fast as possible)
- Tabata (20s work, 10s rest)
- Ladder (increasing/decreasing reps)
- RFT (Rounds For Time)
- Chipper (one-way or two-way)
- Death By (increasing work each minute)
- Complex (barbell complex)`;
    }

    private getWodSchemaShape(): any {
        return {
            description: "string (required) - A clear description of the workout",
            warmup: {
                type: "warmup (required)",
                duration: "string (required, e.g., '10 minutes')",
                activities: [{
                    activity: "string (required)",
                    duration: "string (required, e.g., '5 minutes')",
                    intensity: "string (required, must be 'low', 'medium', or 'high')",
                    exercises: [{
                        name: "string (required)",
                        reps: "string (required, e.g., '10' or '3x10')",
                        sets: "string (required, e.g., '3' or '3x10')",
                        rest: "string (required, e.g., '1 min')"
                    }]
                }]
            },
            workout: {
                type: "string (required, must be one of: 'AMRAP', 'EMOM', 'For Time', 'Tabata', 'Ladder', 'RFT', 'Chipper', 'Death By', 'Complex')",
                wodDescription: "string (required)",
                wodStrategy: "string (required)",
                wodGoal: "string (required)",
                duration: "string (required, e.g., '40 minutes')",
                rounds: "number (required for AMRAP, RFT, Chipper; optional for others)",
                exercises: [{
                    exercise: "string (required)",
                    type: "string (required, must be one of: 'strength', 'cardio', 'gymnastics', 'olympic', 'accessory')",
                    reps: "string (required, e.g., '5' or '3x5')",
                    weight: "string (required, numbers only, e.g., '135')",
                    goal: "string (required)",
                    scalingOptions: [{
                        description: "string (required)",
                        exercise: "string (required)",
                        reps: "string (required)"
                    }]
                }],
                timeCap: "string (required for For Time, optional for others, e.g., '20 minutes')",
                targetScore: "string (required for AMRAP, optional for others, e.g., '100 reps')",
                notes: "string (optional)",
                equipment: ["string (optional)"]
            },
            cooldown: {
                type: "cooldown (required)",
                duration: "string (required, e.g., '10 minutes')",
                activities: [{
                    activity: "string (required)",
                    duration: "string (required, e.g., '5 minutes')",
                    intensity: "string (required, must be 'low', 'medium', or 'high')",
                    notes: "string (optional)"
                }]
            },
            recovery: "string (required)",
            difficulty: "string (optional, must be 'beginner', 'intermediate', or 'advanced')",
            estimatedCalories: "number (optional)",
            tags: ["string (optional)"],
            notes: "string (optional)"
        };
    }

    private validateWorkoutTypeRecommendation(recommendation: WodTypeRecommendation): void {
        if (!recommendation.workoutType || !recommendation.durationRange ||
            !recommendation.intensity || !recommendation.focus) {
            throw new InvalidAIResponseError('Invalid workout type recommendation format');
        }
    }
}
