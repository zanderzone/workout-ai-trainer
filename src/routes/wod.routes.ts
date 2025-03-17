import { Router } from 'express';
import { OpenAIWorkoutAdapter } from '../services/wod.service';
import { MongoClient } from 'mongodb';
import wodController from '../controllers/wod.controller';
import { getWodGenerator } from '../services/wod.service';

const router = Router();
const workoutAdapter = new OpenAIWorkoutAdapter();
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const client = new MongoClient(mongoUrl);
const dbName = 'workoutDB';

router.post('/wod', wodController.createWod);

router.get('/wod/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const wodCollection = req.app.locals.wodCollection;
        const wod = await wodCollection.findOne({ _id: id });

        if (!wod) {
            res.status(404).json({ error: 'WOD not found' });
            return;
        }

        res.status(200).json(wod);
    } catch (error) {
        console.error("Error fetching WOD:", error);
        res.status(500).json({ error: 'Failed to fetch WOD' });
    }
});

export default router;