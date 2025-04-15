import { Request, Response } from 'express';
import { DatabaseManager } from '../services/database.service';
import { z } from 'zod';

// Validation schema for fitness profile updates
const fitnessProfileSchema = z.object({
    fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    goals: z.array(z.enum([
        'weight loss',
        'muscle gain',
        'strength',
        'endurance',
        'power',
        'flexibility',
        'general fitness'
    ])),
    availableEquipment: z.array(z.string()),
    ageRange: z.enum(['18-24', '25-34', '35-44', '45-54', '55+']),
    sex: z.enum(['male', 'female', 'other']),
    injuriesOrLimitations: z.array(z.string()).optional(),
    preferredTrainingDays: z.array(z.enum([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ])).optional(),
    preferredWorkoutDuration: z.enum(['short', 'medium', 'long']).optional(),
    locationPreference: z.enum(['gym', 'home', 'park', 'indoor', 'outdoor', 'both']).optional(),
});

const fitnessProfileController = {
    async updateProfile(req: Request, res: Response) {
        try {
            // Check authentication
            if (!req.user?.userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }

            // Validate request body
            let validatedData;
            try {
                validatedData = fitnessProfileSchema.parse(req.body);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return res.status(400).json({
                        success: false,
                        error: error.errors[0].message
                    });
                }
                throw error;
            }

            // Get database collection
            const dbManager = DatabaseManager.getInstance();
            const db = await dbManager.getDatabase();
            const collection = db.collection('fitness_profiles');

            // Check if profile exists
            const existingProfile = await collection.findOne({ userId: req.user.userId });

            if (!existingProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Update profile
            const updatedProfile = await collection.findOneAndUpdate(
                { userId: req.user.userId },
                {
                    $set: {
                        ...validatedData,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: 'after' }
            );

            if (!updatedProfile) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Return success response
            return res.status(200).json({
                success: true,
                data: {
                    profile: updatedProfile
                }
            });

        } catch (error) {
            console.error('Error updating fitness profile:', error);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }
    }
};

export default fitnessProfileController; 