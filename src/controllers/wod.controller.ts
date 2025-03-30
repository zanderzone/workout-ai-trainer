import { getWodGenerator } from "../services/wod.service";
import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { formatOpenAIErrorResponse, OpenAIRateLimitError } from "../errors/openai";
import { handleOpenAIError } from "../errors/openai";
import { enhancedWodValidationSchema } from "../validation/workout.validation";
import { WodType } from "../types/wod.types";

// Request validation schema based on testWodGeneration.ts parameters
const createWodRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    fitnessProfile: z.object({
        userId: z.string(),
        ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
        sex: z.enum(["male", "female", "other"]).optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
        goals: z.array(z.enum([
            "weight loss",
            "muscle gain",
            "strength",
            "endurance",
            "power",
            "flexibility",
            "general fitness"
        ])),
        injuriesOrLimitations: z.array(z.string()).optional(),
        availableEquipment: z.array(z.string()),
        preferredTrainingDays: z.array(z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ])).optional(),
        preferredWorkoutDuration: z.enum(["short", "medium", "long"]).optional(),
        locationPreference: z.enum([
            "gym",
            "home",
            "park",
            "indoor",
            "outdoor",
            "both"
        ]).optional(),
        createdAt: z.date(),
        updatedAt: z.date()
    }).optional(),
    workoutRequest: z.object({
        userDescription: z.string().max(500).optional(),
        scalingPreference: z.string().optional(),
        includeScalingOptions: z.boolean().optional(),
        totalAvailableTime: z.number().int().positive().optional(),
        workoutPlanDuration: z.number().int().positive().optional(),
        workoutFocus: z.enum([
            "Strength",
            "Conditioning",
            "Strength & Conditioning",
            "Mobility",
            "Endurance"
        ]).optional(),
        includeWarmups: z.boolean().optional(),
        includeAlternateMovements: z.boolean().optional(),
        includeCooldown: z.boolean().optional(),
        includeRestDays: z.boolean().optional(),
        includeBenchmarkWorkouts: z.boolean().optional(),
        outdoorWorkout: z.boolean().optional(),
        periodization: z.enum([
            "concurrent",
            "linear",
            "undulating"
        ]).optional(),
        currentWeather: z.enum([
            "rainy",
            "sunny",
            "cloudy",
            "snowy",
            "indoor"
        ]).optional(),
        includeExercises: z.array(z.string()).optional(),
        excludeExercises: z.array(z.string()).optional(),
        wodRequestTime: z.date().optional()
    }).optional()
});

export const wodController = {
    generateWod: async (req: Request, res: Response) => {
        try {
            const { userId, fitnessProfile, workoutRequest } = createWodRequestSchema.parse(req.body);
            const wodCollection: Collection<WodType> = req.app.locals.wodCollection;

            if (!wodCollection) {
                throw new Error('Database connection not initialized');
            }

            const wodService = getWodGenerator(wodCollection);

            // Add createdAt and updatedAt to fitnessProfile if it exists
            const profileWithDates = fitnessProfile ? {
                ...fitnessProfile,
                createdAt: new Date(),
                updatedAt: new Date()
            } : undefined;

            // Add required fields to workoutRequest if it exists
            const requestWithMetadata = workoutRequest ? {
                ...workoutRequest,
                requestId: uuidv4(),
                userId,
                wodRequestTime: workoutRequest.wodRequestTime || new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            } : undefined;

            // Generate WOD using the new types
            const result = await wodService.generateWod(userId, profileWithDates, requestWithMetadata);

            res.json(result);
        } catch (error) {
            if (error instanceof OpenAIRateLimitError) {
                res.status(429).json(formatOpenAIErrorResponse(error));
            } else {
                handleOpenAIError(error);
            }
        }
    },

    async getWod(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const wodCollection: Collection<WodType> = req.app.locals.wodCollection;
            if (!wodCollection) {
                throw new Error('Database connection not initialized');
            }

            const wodService = getWodGenerator(wodCollection);

            // Try to find by wodId first (UUID)
            let wod = await wodService.getByWodId(id);

            // If not found, try to find by _id (ObjectId)
            if (!wod) {
                try {
                    const doc = await wodCollection.findOne({ _id: new ObjectId(id) });
                    if (doc) {
                        wod = doc as WodType;
                    }
                } catch (error) {
                    // If ObjectId conversion fails, it's an invalid ID
                    res.status(400).json({ error: 'Invalid WOD ID format' });
                    return;
                }
            }

            if (!wod) {
                res.status(404).json({ error: 'WOD not found' });
                return;
            }

            // Validate retrieved WOD against enhanced schema
            const validatedWod = enhancedWodValidationSchema.parse(wod);
            res.status(200).json(validatedWod);
        } catch (error) {
            console.error("Error fetching WOD:", error);

            if (error instanceof z.ZodError) {
                res.status(500).json({
                    error: 'Invalid WOD data in database',
                    details: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }

            res.status(500).json({ error: 'Failed to fetch WOD' });
        }
    }
};

export default wodController;