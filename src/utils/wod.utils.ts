import { WorkoutRequest } from '../types/workoutRequest.types';
import { WodType } from '../types/wod.types';
import { workoutRequestSchema } from '../types/workoutRequest.types';
import { InvalidWorkoutRequestError, InvalidWodStructureError } from '../errors/wod.errors';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const exerciseSchema = z.object({
    exercise: z.string(),
    type: z.enum(['strength', 'cardio', 'gymnastics', 'olympic', 'accessory', 'power', 'endurance']),
    reps: z.string(),
    weight: z.string().optional(),
    goal: z.string(),
    scalingOptions: z.array(z.object({
        description: z.string(),
        exercise: z.string(),
        reps: z.string()
    }))
}).refine((data) => {
    // Weight is required for strength and olympic exercises
    return !['strength', 'olympic'].includes(data.type) || data.weight !== undefined;
}, {
    message: "Weight is required for strength and olympic exercises",
    path: ["weight"]
});

const workoutSchema = z.object({
    type: z.string(),
    wodDescription: z.string(),
    wodStrategy: z.string(),
    wodGoal: z.string(),
    duration: z.string(),
    exercises: z.array(exerciseSchema),
    rounds: z.number().optional(),
    timeCap: z.string().optional(),
    targetScore: z.string().optional(),
    notes: z.string().optional(),
    equipment: z.array(z.string()).optional()
}).refine((data) => {
    // Validate based on workout type
    switch (data.type) {
        case 'AMRAP':
            return data.rounds !== undefined;
        case 'For Time':
            return data.timeCap !== undefined;
        case 'RFT':
            return data.rounds !== undefined && data.timeCap !== undefined;
        case 'Chipper':
            return data.timeCap !== undefined;
        default:
            return true;
    }
}, {
    message: "Workout type specific fields are missing",
    path: ["type"]
});

const wodSchema = z.object({
    description: z.string(),
    warmup: z.object({
        type: z.literal('warmup'),
        duration: z.string(),
        activities: z.array(z.object({
            activity: z.string(),
            duration: z.string(),
            intensity: z.enum(['low', 'medium', 'high']),
            exercises: z.array(z.object({
                name: z.string(),
                reps: z.string(),
                sets: z.string(),
                rest: z.string()
            }))
        }))
    }),
    workout: workoutSchema,
    cooldown: z.object({
        type: z.literal('cooldown'),
        duration: z.string(),
        activities: z.array(z.object({
            activity: z.string(),
            duration: z.string(),
            intensity: z.enum(['low', 'medium', 'high']),
            notes: z.string().optional()
        }))
    }),
    recovery: z.string(),
    difficulty: z.string().optional(),
    estimatedCalories: z.number().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional()
});

export function validateWorkoutRequest(request: Partial<WorkoutRequest>): WorkoutRequest {
    const result = workoutRequestSchema.safeParse(request);
    if (!result.success) {
        throw new InvalidWorkoutRequestError(result.error.message);
    }
    return result.data;
}

export function validateWodStructure(data: unknown): WodType {
    try {
        return wodSchema.parse(data) as WodType;
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Convert Zod errors to a readable string
            const errorMessage = error.errors.map(err =>
                `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            throw new InvalidWodStructureError(errorMessage);
        }
        throw error;
    }
}

export function createBaseWorkoutRequest(userId: string): WorkoutRequest {
    return {
        requestId: uuidv4(),
        userId,
        userDescription: '',
        scalingPreference: 'intermediate',
        includeScalingOptions: true,
        totalAvailableTime: 45,
        workoutType: '',
        wodDuration: '',
        intensity: '',
        workoutFocus: 'Strength & Conditioning', // Set a default value that matches the type
        includeWarmups: true,
        includeCooldown: true,
        outdoorWorkout: false,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        includeRestDays: false,
        includeBenchmarkWorkouts: false,
        includeAlternateMovements: false,
        includeExercises: [],
        excludeExercises: []
    };
}

export function constructWod(
    userId: string,
    aiResponse: any,
    workoutType: string
): WodType {
    // Add required fields based on workout type
    const workout = {
        type: workoutType,
        ...aiResponse.workout,
        // Ensure required fields have default values
        rounds: aiResponse.workout.rounds || 5,
        timeCap: aiResponse.workout.timeCap || '20 minutes',
        targetScore: aiResponse.workout.targetScore || '5+ rounds'
    };

    const wod: WodType = {
        wodId: uuidv4(),
        userId,
        description: aiResponse.description || "Generated Workout",
        warmup: {
            type: "warmup",
            ...aiResponse.warmup
        },
        workout,
        cooldown: {
            type: "cooldown",
            ...aiResponse.cooldown
        },
        recovery: aiResponse.recovery,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    validateWodStructure(wod);
    return wod;
} 