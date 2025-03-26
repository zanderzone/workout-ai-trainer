import { getWodGenerator } from "../services/wod.service";
import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";
import { z } from "zod";
import { WorkoutOptions } from "../types/workoutOptions.types";
import { UserProfile } from "../types/userProfile.types";
import { v4 as uuidv4 } from 'uuid';

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
    workoutOptions: z.object({
        totalAvailableTime: z.string().optional(),
        userDescription: z.string().optional(),
        workoutDuration: z.string().optional(),
        scaling: z.string().optional(),
        includeScalingOptions: z.boolean().optional(),
        includeWarmups: z.boolean().optional(),
        includeAlternateMovements: z.boolean().optional(),
        includeCooldown: z.boolean().optional(),
        includeRestDays: z.boolean().optional(),
        includeBenchmarkWorkouts: z.boolean().optional(),
        availableEquipment: z.array(z.string()).optional(),
        weather: z.string().optional(),
        location: z.string().optional(),
        indoorAndOutdoorWorkout: z.boolean().optional(),
        includeExercises: z.array(z.string()).optional(),
        excludeExcercises: z.array(z.string()).optional(),
        wodRequestTime: z.string().optional()
    }).optional()
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
            const { wod } = await workoutGenerator.generateWod(
                userId,
                userProfile || {}, // Provide empty object if userProfile is not provided
                workoutOptions ? { ...workoutOptions, userId } : { userId } // Include userId in workoutOptions
            );

            // Add UUID to the WOD
            const wodWithId = {
                ...wod,
                wodId: uuidv4()
            };

            const result = await wodCollection.insertOne(wodWithId);

            if (!result.acknowledged) {
                throw new Error('Failed to save WOD to database');
            }

            res.status(201).json(wodWithId);

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

            // Type guard for OpenAI API errors
            if (error && typeof error === 'object' && 'response' in error &&
                (error as OpenAIError).response?.status === 429) {
                res.status(429).json({ error: 'Rate limit exceeded' });
                return;
            }

            // Safe error message extraction
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
                error: 'Failed to generate WOD',
                message: errorMessage
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

            res.status(200).json(wod);
        } catch (error) {
            console.error("Error fetching WOD:", error);
            res.status(500).json({ error: 'Failed to fetch WOD' });
        }
    }
};

export default wodController;