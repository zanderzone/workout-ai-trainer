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
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'workout_ai_trainer_test' : (process.env.DB_NAME || 'workout_ai_trainer');

function formatWodToMarkdown(wod: WodType, user: User, fitnessProfile: FitnessProfile): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const warmupExercises = wod.warmup?.activities?.map(activity => {
        const exercises = activity.exercises?.map(ex => `- ${ex.name}: ${ex.reps}${ex.sets ? ` (${ex.sets} sets)` : ''}`).join('\n') || '';
        return `### ${activity.activity || 'Activity'} (${activity.duration || 'duration not specified'})\n${exercises}\n`;
    }).join('\n') || '';

    const workoutExercises = wod.workout?.exercises?.map(exercise => {
        const scalingOptions = exercise.scalingOptions?.map(option =>
            `- ${option.description}`
        ).join('\n') || '';

        return `### ${exercise.exercise}${exercise.weight ? ` (${exercise.weight} lbs)` : ''}\n` +
            `- Reps: ${exercise.reps}\n` +
            `- Type: ${exercise.type}\n` +
            `- Goal: ${exercise.goal}\n` +
            (scalingOptions ? `\nScaling Options:\n${scalingOptions}\n` : '');
    }).join('\n') || '';

    const cooldownExercises = wod.cooldown?.activities?.map(activity =>
        `### ${activity.activity || 'Activity'} (${activity.duration || 'duration not specified'})\n` +
        (activity.exercises?.map(ex => `- ${ex.name}: ${ex.reps}${ex.sets ? ` (${ex.sets} sets)` : ''}`).join('\n') || '')
    ).join('\n') || '';

    return `# ${wod.workout?.type || 'Workout'} - ${timestamp}\n\n` +
        `## User Profile\n` +
        `- Name: ${user.firstName} ${user.lastName}\n` +
        `- Fitness Level: ${fitnessProfile.fitnessLevel}\n` +
        `- Goals: ${fitnessProfile.goals.join(', ')}\n` +
        `- Location: ${fitnessProfile.locationPreference}\n\n` +
        `## Workout Description\n` +
        `${wod.description || ''}\n\n` +
        `## Warmup (${wod.warmup?.duration || 'duration not specified'})\n` +
        `${warmupExercises}\n` +
        `## Main Workout\n` +
        `### ${wod.workout?.type || 'Workout'}\n` +
        `${wod.workout?.wodDescription || ''}\n\n` +
        `### Strategy\n` +
        `${wod.workout?.wodStrategy || ''}\n\n` +
        `### Goal\n` +
        `${wod.workout?.wodGoal || ''}\n\n` +
        `### Exercises\n` +
        `${workoutExercises}\n` +
        `## Cooldown\n` +
        `${cooldownExercises}\n` +
        `## Recovery\n` +
        `${wod.recovery || ''}\n`;
}

async function writeWodToFile(wod: WodType, user: User, fitnessProfile: FitnessProfile) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `generate-sample-wod-${timestamp}.md`;
    const filePath = path.join(process.cwd(), 'docs', 'sample-wods', fileName);

    const markdown = formatWodToMarkdown(wod, user, fitnessProfile);

    try {
        fs.writeFileSync(filePath, markdown);
        console.log(`\nWOD written to: ${filePath}`);
    } catch (error) {
        console.error('Error writing WOD to file:', error);
    }
}

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
            userDescription: "I'm interested in a WOD that includes a barbell movement. I'm an intermediate athlete with 15 years of Crossfit and 10 years as a competitive weightlifter.",
            scalingPreference: "beginner-friendly",
            includeScalingOptions: true,
            workoutFocus: "Strength & Conditioning",
            includeWarmups: true,
            includeAlternateMovements: true,
            includeCooldown: true,
            wodDuration: "10 minutes to 20 minutes",
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

        // Write WOD to markdown file
        await writeWodToFile(wod, user, fitnessProfile);

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