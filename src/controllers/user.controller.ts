import { Request, Response } from "express";
import { z } from "zod";
import { UserProfile } from "../types/userProfile.types";
import { ValidationError, NotFoundError, DatabaseError, UnauthorizedError } from "../utils/errors";
import jwt from 'jsonwebtoken';

// Request validation schemas
const createUserSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    profileData: z.object({
        ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
        sex: z.enum(["male", "female", "other"]).optional(),
        fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        injuriesOrLimitations: z.array(z.string()).optional()
    })
});

const profileDataSchema = z.object({
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]),
    sex: z.enum(["male", "female", "other"]),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
    goals: z.array(z.string()),
    injuriesOrLimitations: z.array(z.string()),
    workoutDuration: z.string(),
    equipment: z.array(z.string()),
    gymLocation: z.string()
});

const userController = {
    async createUser(req: Request, res: Response) {
        // Validate request body
        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            throw new ValidationError("Invalid request data", validation.error.errors);
        }

        const { userId, profileData } = validation.data;

        // Check if user exists
        const existingUser = await req.app.locals.userCollection.findOne({ providerId: userId });
        if (existingUser) {
            throw new ValidationError("User already exists");
        }

        try {
            await req.app.locals.userCollection.insertOne({
                providerId: userId,
                ...profileData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            res.status(201).json({ message: "User profile created successfully" });
        } catch (error) {
            throw new DatabaseError("Failed to create user profile", error);
        }
    },

    async getUser(req: Request, res: Response) {
        const userId = req.params.userId;
        if (!userId) {
            throw new ValidationError("User ID is required");
        }

        const userProfile = await req.app.locals.userCollection.findOne({ providerId: userId });
        if (!userProfile) {
            throw new NotFoundError(`User profile not found for ID: ${userId}`);
        }

        // Check if user is authorized to view this profile
        if (req.user && req.user.providerId !== userId) {
            throw new UnauthorizedError("Not authorized to view this profile");
        }

        res.status(200).json(userProfile);
    },

    async updateUser(req: Request, res: Response) {
        try {
            console.log('Received profile update request:', req.body);

            // Get providerId from JWT token
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const providerId = decoded.providerId;

            console.log('Decoded token:', { providerId, email: decoded.email });

            // Validate request body
            const validation = profileDataSchema.safeParse(req.body.profileData);
            if (!validation.success) {
                console.error('Validation error:', validation.error);
                throw new ValidationError("Invalid profile data", validation.error.errors);
            }

            const profileData = validation.data;
            console.log('Validated profile data:', profileData);

            // Update user profile
            const result = await req.app.locals.userCollection.updateOne(
                { providerId },
                {
                    $set: {
                        ...profileData,
                        isRegistrationComplete: true,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('Database update result:', result);

            if (result.matchedCount === 0) {
                throw new NotFoundError(`User not found with providerId: ${providerId}`);
            }

            res.status(200).json({
                message: "Profile updated successfully",
                isRegistrationComplete: true
            });
        } catch (error) {
            console.error('Profile update error:', error);
            if (error instanceof ValidationError || error instanceof UnauthorizedError || error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to update profile", error);
        }
    }
};

export default userController;
