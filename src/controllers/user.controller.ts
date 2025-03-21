import { Request, Response } from "express";
import { z } from "zod";
import { UserProfile } from "../types/userProfile.types";
import { ValidationError, NotFoundError, DatabaseError, UnauthorizedError } from "../utils/errors";

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
        const userId = req.params.userId;
        if (!userId) {
            throw new ValidationError("User ID is required");
        }

        // Validate request body
        const validation = createUserSchema.safeParse(req.body);
        if (!validation.success) {
            throw new ValidationError("Invalid request data", validation.error.errors);
        }

        const { profileData } = validation.data;

        // Check if user exists
        const existingUser = await req.app.locals.userCollection.findOne({ providerId: userId });
        if (!existingUser) {
            throw new NotFoundError(`User profile not found for ID: ${userId}`);
        }

        // Check if user is authorized to update this profile
        if (req.user && req.user.providerId !== userId) {
            throw new UnauthorizedError("Not authorized to update this profile");
        }

        try {
            await req.app.locals.userCollection.updateOne(
                { providerId: userId },
                {
                    $set: {
                        ...profileData,
                        updatedAt: new Date()
                    }
                }
            );
            res.status(200).json({ message: "User profile updated successfully" });
        } catch (error) {
            throw new DatabaseError("Failed to update user profile", error);
        }
    }
};

export default userController;
