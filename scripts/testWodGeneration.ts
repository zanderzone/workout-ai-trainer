import { MongoClient } from 'mongodb';
import { getWodGenerator } from '../src/services/wod.service';
import { FitnessProfile } from '../src/types/fitnessProfile.types';
import { WorkoutRequest } from '../src/types/workoutRequest.types';
import { WodType } from '../src/types/wod.types';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'workout_ai_trainer';

async function testWodGeneration() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        const wodCollection = db.collection<WodType>('wods');

        // Create a test fitness profile
        const userProfile: FitnessProfile = {
            userId: uuidv4(),
            ageRange: "25-34",
            sex: "male",
            fitnessLevel: "beginner",
            goals: ["weight loss", "strength", "endurance", "power", "flexibility", "general fitness"],
            injuriesOrLimitations: ["left knee tightness"],
            availableEquipment: [
                "bodyweight",
                "dumbbells",
                "resistance bands",
                "pull-up bar",
                "yoga mat"
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Create a test workout request
        const workoutRequest: WorkoutRequest = {
            requestId: uuidv4(),
            userId: userProfile.userId,
            userDescription: "I want to improve my overall fitness and strength",
            scalingPreference: "lighter weight",
            includeScalingOptions: true,
            totalAvailableTime: 60,
            workoutPlanDuration: 4,
            workoutFocus: "Strength & Conditioning",
            includeWarmups: true,
            includeAlternateMovements: true,
            includeCooldown: true,
            includeRestDays: true,
            includeBenchmarkWorkouts: true,
            outdoorWorkout: false,
            periodization: "concurrent",
            currentWeather: "indoor",
            includeExercises: ["push-ups", "pull-ups", "squats"],
            excludeExercises: ["deadlifts"],
            wodRequestTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const wodService = getWodGenerator(wodCollection);

        console.log('Generating WOD...');
        const result = await wodService.generateWod(
            userProfile.userId,
            userProfile,
            workoutRequest
        );

        console.log('Generated WOD:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

(async () => {
    try {
        await testWodGeneration();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
