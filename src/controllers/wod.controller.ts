import { getWodGenerator } from "../services/wod.service";
import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import { WorkoutOptions } from "../types/workoutOptions.types";
import { UserProfile } from "../types/userProfile.types";
import { v4 as uuidv4 } from 'uuid';
import { WodService } from "../services/wod.service";
import { formatOpenAIErrorResponse } from "../errors/openai";
import { handleOpenAIError } from "../errors/openai";
import { enhancedWorkoutOptionsSchema, enhancedWodValidationSchema } from "../validation/workout.validation";
import { AiWodSchema } from "../types/wod.types";

// Request validation schema based on testWodGeneration.ts parameters
const createWodRequestSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    userProfile: z.object({
        userId: z.string().optional(),
        ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
        sex: z.enum(["male", "female", "other"]).optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        goals: z.array(z.string()).optional(),
        injuriesOrLimitations: z.array(z.string()).optional(),
        preferredWorkoutDays: z.array(z.string()).optional(),
        equipmentAvailable: z.array(z.string()).optional()
    }).optional(),
    workoutOptions: enhancedWorkoutOptionsSchema.optional()
});

interface OpenAIError {
    response?: {
        status: number;
    };
}

const wodController = {
    async createWod(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const validatedData = createWodRequestSchema.parse(req.body);
            const { userId, userProfile, workoutOptions } = validatedData;

            // Check database connection
            const wodCollection: Collection = req.app.locals.wodCollection;
            if (!wodCollection) {
                throw new Error('Database connection not initialized');
            }

            // Generate and save WOD
            const workoutGenerator = getWodGenerator();

            // Validate userId consistency if workoutOptions is provided
            if (workoutOptions?.userId && workoutOptions.userId !== userId) {
                throw new Error('User ID mismatch: provided userId does not match workoutOptions.userId');
            }

            const response = await workoutGenerator.generateWod(
                userId,
                userProfile || {}, // Provide empty object if userProfile is not provided
                workoutOptions ? { ...workoutOptions, userId } : { userId } // Ensure consistent userId
            );

            // Add required fields before validation
            const wodWithMetadata = {
                ...response.wod.wod,
                wodId: uuidv4(),
                userId,
                description: response.wod.description,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validate generated WOD against enhanced schema
            const validatedWod = enhancedWodValidationSchema.parse(wodWithMetadata);

            // Convert string _id to ObjectId if present
            const documentToInsert = {
                ...validatedWod,
                _id: validatedWod._id ? new ObjectId(validatedWod._id) : undefined
            };

            const result = await wodCollection.insertOne(documentToInsert);

            if (!result.acknowledged) {
                throw new Error('Failed to save WOD to database');
            }

            res.status(201).json(validatedWod);

        } catch (error) {
            console.error("Error in createWod:", error);

            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid request data',
                    details: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }

            // Handle OpenAI errors
            const errorResponse = formatOpenAIErrorResponse(error);
            res.status(errorResponse.status).json({
                error: errorResponse.message,
                details: errorResponse.error
            });
        }
    },

    async getWod(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const wodCollection: Collection = req.app.locals.wodCollection;
            if (!wodCollection) {
                throw new Error('Database connection not initialized');
            }

            // Try to find by wodId first (UUID)
            let wod = await wodCollection.findOne({ wodId: id });

            // If not found, try to find by _id (ObjectId)
            if (!wod) {
                try {
                    wod = await wodCollection.findOne({
                        _id: new ObjectId(id)
                    });
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