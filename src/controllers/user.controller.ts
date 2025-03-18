import { Request, Response } from "express";
import { z } from "zod";
import { UserProfile } from "../types/userProfile.types";

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
        try {
            const validation = createUserSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    error: "Invalid request data",
                    details: validation.error.errors
                });
            }

            const { userId, profileData } = validation.data;
            await req.app.locals.userCollection.updateOne(
                { providerId: userId },
                { $set: profileData },
                { upsert: true }
            );
            res.json({ message: "User profile stored successfully" });
        } catch (error) {
            console.error("Error storing user profile:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async getUser(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const userProfile = await req.app.locals.userCollection.findOne({ providerId: userId });
            if (!userProfile) {
                return res.status(404).json({ error: "User profile not found" });
            }
            res.json(userProfile);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export default userController;
