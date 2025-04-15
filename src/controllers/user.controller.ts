import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError, NotFoundError, UnauthorizedError } from "../errors/base";
import { DatabaseError } from "../errors/database";
import jwt from 'jsonwebtoken';
import { DatabaseManager } from "../utils/databaseManager";

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

const updateUserSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    profilePicture: z.string().optional(),
    accountStatus: z.enum(['active', 'disabled']).optional()
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

const updateFitnessProfileSchema = z.object({
    ageRange: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
    sex: z.enum(["male", "female", "other"]).optional(),
    fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    goals: z.array(z.enum(["weight loss", "muscle gain", "strength", "endurance", "power", "flexibility", "general fitness"])).optional(),
    injuriesOrLimitations: z.array(z.string()).optional(),
    availableEquipment: z.array(z.string()).optional(),
    preferredTrainingDays: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])).optional(),
    preferredWorkoutDuration: z.enum(["short", "medium", "long"]).optional(),
    locationPreference: z.enum(["gym", "home", "park", "indoor", "outdoor", "both"]).optional()
});

const userController = {
    async createUser(req: Request, res: Response): Promise<void> {
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

    async getUser(req: Request, res: Response): Promise<void> {
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

    async updateUser(req: Request, res: Response): Promise<void> {
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
    },

    async getMe(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
                return;
            }

            const db = await DatabaseManager.getInstance().getDb();
            const userCollection = db.collection('users');
            const fitnessProfileCollection = db.collection('fitness_profiles');

            // Get user data
            const user = await userCollection.findOne({ providerId: req.user.providerId });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            // Get fitness profile
            const fitnessProfile = await fitnessProfileCollection.findOne({ userId: req.user.providerId });

            // Remove sensitive data
            const { refreshToken, tokenExpiresAt, password, ...userData } = user;

            res.status(200).json({
                success: true,
                data: {
                    user: userData,
                    fitnessProfile: fitnessProfile || null
                }
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user profile'
            });
        }
    },

    async updateUserById(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
                return;
            }

            // Check if user is authorized to update this profile
            if (!req.user || req.user.providerId !== userId) {
                res.status(401).json({
                    success: false,
                    error: 'Not authorized to update this profile'
                });
                return;
            }

            // Validate request body
            const validation = updateUserSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid update data'
                });
                return;
            }

            const updateData = validation.data;
            console.log('Validated update data:', updateData);

            // Get database instance
            const db = await DatabaseManager.getInstance().getDb();
            const userCollection = db.collection('users');

            // Update user profile
            const result = await userCollection.findOneAndUpdate(
                { providerId: userId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: 'after' }
            );

            if (!result.value) {
                res.status(404).json({
                    success: false,
                    error: `User not found with ID: ${userId}`
                });
                return;
            }

            // Remove sensitive data from response
            const { refreshToken, tokenExpiresAt, ...userData } = result.value;

            res.status(200).json({
                success: true,
                data: {
                    user: userData
                }
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user profile'
            });
        }
    },

    async updateFitnessProfile(req: Request, res: Response): Promise<void> {
        try {
            // Get user from JWT
            const userId = req.user?.userId;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            // Validate request body
            const validatedData = updateFitnessProfileSchema.parse(req.body);

            // Get database instance
            const dbManager = DatabaseManager.getInstance();

            // Update profile in database
            const updatedProfile = await dbManager.updateFitnessProfile(userId, validatedData);

            res.json({
                message: "Fitness profile updated successfully",
                profile: updatedProfile
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError("Invalid profile data", error.errors);
            }
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            throw new DatabaseError("Failed to update fitness profile");
        }
    },

    async getFitnessProfile(req: Request, res: Response): Promise<void> {
        try {
            // Get user from JWT
            const userId = req.user?.userId;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            // Get database instance
            const dbManager = DatabaseManager.getInstance();

            // Get profile from database
            const profile = await dbManager.getFitnessProfile(userId);
            if (!profile) {
                throw new NotFoundError("Fitness profile not found");
            }

            res.json({
                profile
            });
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to fetch fitness profile");
        }
    },

    async resetFitnessProfile(req: Request, res: Response): Promise<void> {
        try {
            // Get user from JWT
            const userId = req.user?.userId;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            // Get database instance
            const dbManager = DatabaseManager.getInstance();

            // Reset profile in database
            const resetProfile = await dbManager.resetFitnessProfile(userId);

            res.json({
                message: "Fitness profile reset successfully",
                profile: resetProfile
            });
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError("Failed to reset fitness profile");
        }
    }
};

export default userController;
