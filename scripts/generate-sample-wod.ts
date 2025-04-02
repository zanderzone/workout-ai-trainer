import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { OpenAIWorkoutAdapter } from '../src/adapters/openai-workout.adapter';
import { WodModel } from '../src/models/wod.model';
import { WodService } from '../src/services/wod.service';
import { UserService } from '../src/services/user.service';
import { WorkoutRequest } from '../src/types/workoutRequest.types';
import { User } from '../src/types/user.types';
import { FitnessProfile } from '../src/types/fitnessProfile.types';
import { WodType } from '../src/types/wod.types';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'workout_ai_trainer_test' : (process.env.DB_NAME || 'workout_ai_trainer');

async function generateSampleWod() {
    const mongoClient = new MongoClient(MONGO_URI, {
        maxPoolSize: 50,
        minPoolSize: 10,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
    });

    try {
        console.log('Connecting to MongoDB...');
        await mongoClient.connect();
        const mongoDb = mongoClient.db(DB_NAME);

        // Initialize collections with proper types
        const userCollection = mongoDb.collection<User>("users");
        const fitnessProfileCollection = mongoDb.collection<FitnessProfile>("fitness_profiles");
        const wodCollection = mongoDb.collection<WodType>("wods");

        // Find Sarah Johnson (home gym beginner)
        const user = await userCollection.findOne({ email: "home.gym.crossfitter@example.com" });
        if (!user) {
            throw new Error("User not found. Please run populate_users.ts first.");
        }

        // Get their fitness profile
        const fitnessProfile = await fitnessProfileCollection.findOne({ userId: user.userId });
        if (!fitnessProfile) {
            throw new Error("Fitness profile not found for user");
        }

        console.log('\nGenerating WOD for:', {
            name: `${user.firstName} ${user.lastName}`,
            fitnessLevel: fitnessProfile.fitnessLevel,
            location: fitnessProfile.locationPreference
        });

        // Create workout request with all required fields
        const workoutRequest: WorkoutRequest = {
            requestId: uuidv4(),
            userId: user.userId,
            userDescription: "Looking for a balanced workout that incorporates both strength and conditioning",
            scalingPreference: "beginner-friendly",
            includeScalingOptions: true,
            workoutFocus: "Strength & Conditioning",
            includeWarmups: true,
            includeAlternateMovements: true,
            includeCooldown: true,
            wodDuration: "15 to 20 minutes",
            wodRequestTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Initialize services and adapters
        const openaiAdapter = new OpenAIWorkoutAdapter();
        const wodService = new WodService(wodCollection, openaiAdapter);
        const userService = new UserService(userCollection, fitnessProfileCollection);
        const wodModel = new WodModel(openaiAdapter, wodService, userService);

        // Generate WOD
        console.log('Generating workout...');
        const wod = await wodModel.generateWod(user.userId, fitnessProfile, workoutRequest);

        // Display the generated WOD
        console.log('\nGenerated Workout:');
        console.log(JSON.stringify(wod, null, 2));

    } catch (error) {
        console.error('Error generating WOD:', error);
    } finally {
        await mongoClient.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the script
generateSampleWod().catch(console.error); 