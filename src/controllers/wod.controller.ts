import { getWodGenerator } from "../services/wod.service";
import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";

const wodController = {
    async createWod(req: Request, res: Response): Promise<void> {
        const { userId, userProfile, workoutOptions }: any = req.body;

        try {
            const wodCollection: Collection = req.app.locals.wodCollection;
            const workoutGenerator = getWodGenerator();
            const { wod } = await workoutGenerator.generateWod(userId, userProfile, workoutOptions);
            await wodCollection.insertOne(wod);
            res.status(201).json(wod);
        } catch (error) {
            console.error("Error generating WOD:", error);
            res.status(500).json({ error: 'Failed to generate WOD' });
        }
    },

    async getWod(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const wodCollection: Collection = req.app.locals.wodCollection;
        const wod = await wodCollection.findOne({ _id: new ObjectId(id) });
        res.status(200).json(wod);
    }
};

export default wodController;