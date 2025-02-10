import { Request, Response } from "express";
import { Collection } from "mongodb";

const userController = {
    async createUser(req: Request, res: Response) {
        const { userId, profileData } = req.body;
        try {
            await req.app.locals.userCollection.updateOne(
                { user_id: userId },
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
            const userProfile = await req.app.locals.userCollection.findOne({ user_id: req.params.userId });
            res.json(userProfile);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export default userController;
