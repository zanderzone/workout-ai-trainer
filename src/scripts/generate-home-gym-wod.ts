import { OpenAIWorkoutAdapter } from '../adapters/openai-workout.adapter';
import { WodModel } from '../models/wod.model';
import { FitnessProfile } from '../types/fitnessProfile.types';
import { WorkoutRequest } from '../types/workoutRequest.types';
import { WodResponse, WodType } from '../types/wod.types';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager, wodService, userService, fitnessProfileService, CollectionInitializer } from '../services/database.service';
import { Application } from 'express';
import { WodGenerationError } from '../errors/wod.errors';

// Function to format the workout as markdown
function formatWorkoutAsMarkdown(wod: WodType): string {
    const date = new Date().toISOString().split('T')[0];

    let markdown = `# Workout of the Day - ${date}\n\n`;

    // Description
    markdown += `## Overview\n${wod.description}\n\n`;

    // Warmup
    markdown += `## Warmup (${wod.warmup.duration})\n`;
    wod.warmup.activities?.forEach((activity: any) => {
        markdown += `### ${activity.activity} (${activity.duration}, ${activity.intensity} intensity)\n`;
        if (activity.exercises) {
            activity.exercises.forEach((exercise: any) => {
                markdown += `- ${exercise.name}: ${exercise.sets}x${exercise.reps}${exercise.rest ? `, rest ${exercise.rest}` : ''}\n`;
            });
        }
    });
    markdown += '\n';

    // Main Workout
    markdown += `## Main Workout (${wod.workout.duration})\n`;
    markdown += `**Type**: ${wod.workout.type}\n\n`;
    markdown += `**Description**: ${wod.workout.wodDescription}\n\n`;

    if (wod.workout.rounds) {
        markdown += `**Rounds**: ${wod.workout.rounds}\n\n`;
    }

    markdown += '### Exercises\n';
    wod.workout.exercises?.forEach((exercise: any) => {
        markdown += `#### ${exercise.exercise}\n`;
        markdown += `- Reps: ${exercise.reps}\n`;
        if (exercise.weight) markdown += `- Weight: ${exercise.weight} lbs\n`;
        markdown += `- Goal: ${exercise.goal}\n`;
        if (exercise.scalingOptions && exercise.scalingOptions.length > 0) {
            markdown += '- Scaling Options:\n';
            exercise.scalingOptions.forEach((option: any) => {
                markdown += `  - ${option.description}\n`;
            });
        }
        markdown += '\n';
    });

    if (wod.workout.wodStrategy) {
        markdown += `### Strategy\n${wod.workout.wodStrategy}\n\n`;
    }

    // Cooldown
    markdown += `## Cooldown (${wod.cooldown.duration})\n`;
    wod.cooldown.activities?.forEach((activity: any) => {
        markdown += `- ${activity.activity} (${activity.duration}, ${activity.intensity} intensity)\n`;
    });
    markdown += '\n';

    // Recovery
    if (wod.recovery) {
        markdown += `## Recovery\n${wod.recovery}\n`;
    }

    return markdown;
}

// Load environment variables
console.log('Current working directory:', process.cwd());
console.log('Loading environment variables...');
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:', {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    NODE_ENV: process.env.NODE_ENV
});

async function generateHomeGymWod() {
    console.log('Starting WOD generation...');

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Initialize database connection
    console.log('Connecting to database...');
    await DatabaseManager.connect();

    try {
        // Create a mock Express app for service initialization
        const app = {} as Application;
        app.locals = {};

        // Initialize collections and services
        const db = DatabaseManager.getDatabase();
        await CollectionInitializer.initializeCollections(db, app);

        // Get the initialized services from the database service
        if (!wodService || !userService || !fitnessProfileService) {
            throw new Error('Services not properly initialized');
        }

        console.log('Initializing WOD generation components...');
        const adapter = new OpenAIWorkoutAdapter();
        const wodModel = new WodModel(adapter, wodService, userService);

        // Define a fitness profile for an intermediate athlete
        const fitnessProfile: FitnessProfile = {
            userId: uuidv4(),
            fitnessLevel: 'intermediate',
            goals: ['strength', 'endurance', 'general fitness'],
            availableEquipment: [
                // Barbells and Weights
                '45lb men\'s barbell',
                '35lb women\'s barbell',
                'bumper plates (400+ lbs)',

                // Cardio Equipment
                'concept2 rower',
                'assault treadmill',
                'assault bike',

                // Gymnastics Equipment
                'pull_up_bar',
                'gymnastic rings',

                // Conditioning Equipment
                'kettlebells',
                'dumbbells',
                'jump rope',
                'ab mat',
                'plyo box',
                'resistance bands',
                'sandbag',
                'medicine ball'
            ],
            locationPreference: 'home',
            preferredWorkoutDuration: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Define a workout request for a varied workout
        const workoutRequest: WorkoutRequest = {
            requestId: uuidv4(),
            userId: fitnessProfile.userId,
            userDescription: 'Looking for a short, intense workout between 10-20 minutes that combines strength and conditioning elements using a fully equipped garage gym with cardio machines and full barbell setup',
            scalingPreference: 'intermediate',
            includeScalingOptions: true,
            totalAvailableTime: 45,
            wodDuration: '10 to 20 minutes',
            workoutFocus: 'Strength & Conditioning',
            includeWarmups: true,
            includeCooldown: true,
            outdoorWorkout: false,
            wodRequestTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Generating WOD with the following profile:', JSON.stringify(fitnessProfile, null, 2));
        console.log('Workout request:', JSON.stringify(workoutRequest, null, 2));

        // Create user in database
        await userService.createUser({
            userId: fitnessProfile.userId,
            email: 'test@example.com',
            providerId: 'test',
            provider: 'google',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save fitness profile
        await fitnessProfileService.createProfile(fitnessProfile.userId, fitnessProfile);

        console.log('Generating WOD...');
        const wod = await wodModel.generateWod(fitnessProfile.userId, fitnessProfile, workoutRequest);

        // Format the workout as markdown
        const markdown = formatWorkoutAsMarkdown(wod);

        // Create the docs directory if it doesn't exist
        const docsDir = path.join(process.cwd(), 'docs', 'workouts');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        // Write the markdown file
        const date = new Date();
        const formattedDate = date.toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-mm-ss
        const filename = path.join(docsDir, `workout-${formattedDate}.md`);
        fs.writeFileSync(filename, markdown);

        console.log(`\nWorkout has been written to: ${filename}`);
        console.log('\nGenerated WOD (JSON format):');
        console.log(JSON.stringify(wod, null, 2));
    } catch (error) {
        console.error('Error generating WOD:', error);
        if (error instanceof WodGenerationError) {
            console.error('WOD Generation Error:', error.message);
        } else if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        // Close database connection
        await DatabaseManager.close();
    }
}

// Run the script
console.log('Script starting...');
generateHomeGymWod().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 