import { OpenAIWorkoutAdapter } from '../adapters/openai-workout.adapter';
import { FitnessProfile } from '../types/fitnessProfile.types';
import { WorkoutRequest } from '../types/workoutRequest.types';
import { WodType } from '../types/wod.types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { MongoClient, Collection } from 'mongodb';
import { User } from '../types/user.types';
import { WodModel } from '../models/wod.model';
import { WodService } from '../services/wod.service';
import { UserService } from '../services/user.service';
import { WodGenerationError } from '../errors/wod.errors';

// Define fitness profiles for sample generation
const beginnerProfile: FitnessProfile = {
    userId: uuidv4(),
    ageRange: "25-34",
    sex: "other",
    fitnessLevel: "beginner",
    goals: ["general fitness", "strength"],
    injuriesOrLimitations: [],
    availableEquipment: ['bodyweight', 'resistance bands', 'dumbbells'],
    createdAt: new Date(),
    updatedAt: new Date()
};

const intermediateProfile: FitnessProfile = {
    userId: uuidv4(),
    ageRange: "25-34",
    sex: "other",
    fitnessLevel: "intermediate",
    goals: ["muscle gain", "strength"],
    injuriesOrLimitations: [],
    availableEquipment: ['barbell', 'dumbbells', 'kettlebells', 'pull-up bar'],
    createdAt: new Date(),
    updatedAt: new Date()
};

const advancedProfile: FitnessProfile = {
    userId: uuidv4(),
    ageRange: "25-34",
    sex: "other",
    fitnessLevel: "advanced",
    goals: ["strength", "power"],
    injuriesOrLimitations: [],
    availableEquipment: ['full gym'],
    createdAt: new Date(),
    updatedAt: new Date()
};

const seniorProfile: FitnessProfile = {
    userId: uuidv4(),
    ageRange: "55+",
    sex: "other",
    fitnessLevel: "beginner",
    goals: ["general fitness", "flexibility"],
    injuriesOrLimitations: ['joint pain', 'limited mobility'],
    availableEquipment: ['resistance bands', 'light dumbbells', 'yoga mat'],
    createdAt: new Date(),
    updatedAt: new Date()
};

// Define workout requests
const workoutRequests: WorkoutRequest[] = [
    {
        requestId: uuidv4(),
        userId: beginnerProfile.userId,
        workoutFocus: "Strength",
        totalAvailableTime: 45,
        scalingPreference: "beginner friendly",
        includeExercises: ['bodyweight squats', 'push-ups', 'resistance band rows'],
        excludeExercises: ['box jumps', 'burpees'],
        includeWarmups: true,
        includeCooldown: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        requestId: uuidv4(),
        userId: intermediateProfile.userId,
        workoutFocus: "Strength & Conditioning",
        totalAvailableTime: 60,
        scalingPreference: "standard",
        includeExercises: ['barbell squats', 'kettlebell swings'],
        excludeExercises: [],
        includeWarmups: true,
        includeCooldown: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        requestId: uuidv4(),
        userId: advancedProfile.userId,
        workoutFocus: "Strength",
        totalAvailableTime: 75,
        scalingPreference: "advanced",
        includeExercises: ['olympic lifts', 'gymnastic movements'],
        excludeExercises: [],
        includeWarmups: true,
        includeCooldown: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        requestId: uuidv4(),
        userId: seniorProfile.userId,
        workoutFocus: "Mobility",
        totalAvailableTime: 45,
        scalingPreference: "scaled",
        includeExercises: ['resistance band exercises', 'bodyweight movements'],
        excludeExercises: ['high impact movements'],
        includeWarmups: true,
        includeCooldown: true,
        wodRequestTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Initialize MongoDB connection and collections
async function initializeDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(mongoUri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const dbName = process.env.DB_NAME || 'workout_ai_trainer';
        const db = client.db(dbName);
        
        // Get or create collections
        // Get or create collections
        const wodCollection = db.collection<WodType>('wods');
        const userCollection = db.collection<User>('users');
        const fitnessProfileCollection = db.collection<FitnessProfile>('fitness_profiles');
        // Initialize services
        const openaiAdapter = new OpenAIWorkoutAdapter();
        const wodService = new WodService(wodCollection, openaiAdapter);
        
        // Create a minimal UserService that returns the fitness profile
        const userService = new UserService(userCollection, fitnessProfileCollection);
        
        // Create a mock implementation of getFitnessProfile that returns the profile directly
        // This overrides the original method to avoid database lookups
        userService.getFitnessProfile = async (userId: string): Promise<FitnessProfile> => {
            // Find the profile in our sample profiles
            const profiles = [beginnerProfile, intermediateProfile, advancedProfile, seniorProfile];
            const profile = profiles.find(p => p.userId === userId);
            
            if (!profile) {
                throw new Error('Fitness profile not found for user');
            }
            
            return profile;
        };
        
        // Initialize WodModel with our services
        const wodModel = new WodModel(openaiAdapter, wodService, userService);
        
        return {
            client,
            wodModel
        };
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../../docs/sample-wods');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to format workout as markdown
function formatWorkoutAsMarkdown(profile: FitnessProfile, request: WorkoutRequest, workout: WodType): string {
    return `# Workout of the Day - ${profile.fitnessLevel.toUpperCase()}

## Athlete Profile
- Age Range: ${profile.ageRange}
- Fitness Level: ${profile.fitnessLevel}
- Goals: ${profile.goals.join(', ')}
- Equipment: ${profile.availableEquipment.join(', ')}
${profile.injuriesOrLimitations?.length ? `- Limitations: ${profile.injuriesOrLimitations.join(', ')}` : ''}

## Workout Parameters
- Focus: ${request.workoutFocus}
- Total Time: ${request.totalAvailableTime} minutes
- Scaling: ${request.scalingPreference}

## Workout Details
${workout.description}

### Warm-up (${workout.warmup.duration})
${workout.warmup.activities?.map(activity => `
- ${activity.activity} (${activity.duration}, ${activity.intensity} intensity)
${activity.exercises ? activity.exercises.map(exercise => `  - ${exercise.name}: ${exercise.sets} sets of ${exercise.reps} (rest: ${exercise.rest})`).join('\n') : ''}`).join('\n') || ''}

### Main Workout (${workout.workout.duration})
${workout.workout.wodDescription}

Strategy: ${workout.workout.wodStrategy}
Goal: ${workout.workout.wodGoal}

#### Exercises:
${workout.workout.exercises?.map(exercise => `
- ${exercise.exercise}
  - Type: ${exercise.type}
  - Reps: ${exercise.reps}
  - Weight: ${exercise.weight || 'bodyweight'}
  - Goal: ${exercise.goal}
  ${exercise.scalingOptions ? `\n      Scaling Options:\n      ${exercise.scalingOptions.map(option => `- ${option.description}: ${option.exercise} (${option.reps} reps)`).join('\n      ')}` : ''}`).join('\n') || ''}

### Cooldown (${workout.cooldown.duration})
${workout.cooldown.activities?.map(activity => `- ${activity.activity} (${activity.duration}, ${activity.intensity} intensity)`).join('\n') || ''}

### Recovery
${workout.recovery || ''}
`;
}

// Main execution function
async function generateSampleWorkouts() {
    const profiles = [beginnerProfile, intermediateProfile, advancedProfile, seniorProfile];
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Initialize the database and services
    const { client, wodModel } = await initializeDatabase();
    
    try {
        for (let i = 0; i < profiles.length; i++) {
            try {
                console.log(`Generating workout for ${profiles[i].fitnessLevel} profile...`);
                
                // Use WodModel to generate the workout
                const wod = await wodModel.generateWod(
                    profiles[i].userId,
                    profiles[i],
                    workoutRequests[i]
                );
                
                // Format and save the workout
                const markdown = formatWorkoutAsMarkdown(profiles[i], workoutRequests[i], wod);
                
                // Generate a filename based on the profile level and timestamp
                const filename = `${timestamp}-${profiles[i].fitnessLevel}-workout.md`;
                const filePath = path.join(outputDir, filename);
                
                // Write the markdown file
                fs.writeFileSync(filePath, markdown);
                console.log(`Saved workout to ${filePath}`);
            } catch (error) {
                if (error instanceof WodGenerationError) {
                    console.error(`WodGenerationError for ${profiles[i].fitnessLevel} profile: ${error.message}`);
                    // Create an error file to document the failure
                    const errorFilename = `${timestamp}-${profiles[i].fitnessLevel}-error.md`;
                    const errorFilePath = path.join(outputDir, errorFilename);
                    const errorMarkdown = `# Error Generating Workout for ${profiles[i].fitnessLevel}\n\n## Error Details\n- Error Type: ${error.name}\n- Message: ${error.message}\n\n## Profile Information\n${JSON.stringify(profiles[i], null, 2)}\n\n## Workout Request\n${JSON.stringify(workoutRequests[i], null, 2)}`;
                    fs.writeFileSync(errorFilePath, errorMarkdown);
                    console.log(`Saved error information to ${errorFilePath}`);
                } else {
                    console.error(`Error generating workout for ${profiles[i].fitnessLevel} profile:`, error);
                }
                // Continue with next profile despite errors
            }
        }
        
        console.log('All sample workouts generated successfully');
    } catch (error) {
        console.error('Failed to generate sample workouts:', error);
    } finally {
        // Ensure database connection is closed
        try {
            await client.close();
            console.log('MongoDB connection closed');
        } catch (dbError) {
            console.error('Error closing MongoDB connection:', dbError);
        }
    }
}

// Execute the script
generateSampleWorkouts().catch(console.error);

