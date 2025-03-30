import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { BaseUser } from '../src/types/user.types';
import { FitnessProfile } from '../src/types/fitnessProfile.types';
import { WorkoutRequest } from '../src/types/workoutRequest.types';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

interface OldUserProfile {
    userId: string;
    ageRange?: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
    sex?: "male" | "female" | "other";
    fitnessLevel?: "beginner" | "intermediate" | "advanced";
    goals?: string[];
    injuriesOrLimitations?: string[];
    createdAt: Date;
    updatedAt: Date;
}

interface OldWorkoutOptions {
    userId: string;
    userDescription?: string;
    scaling?: string;
    includeScalingOptions?: boolean;
    totalAvailableTime?: string;
    workoutPlanDuration?: string;
    workoutDuration?: string;
    workoutFocus?: string;
    availableEquipment?: string[];
    preferredTrainingDays?: string[];
    includeWarmups?: boolean;
    includeAlternateMovements?: boolean;
    includeCooldown?: boolean;
    includeRestDays?: boolean;
    includeBenchmarkWorkouts?: boolean;
    outdoorWorkout?: boolean;
    indoorAndOutdoorWorkout?: boolean;
    periodization?: string;
    weather?: string;
    location?: string;
    goals?: string[];
    includeExercises?: string[];
    excludeExcercises?: string[];
    wodRequestTime?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

async function migrateData() {
    let mongoClient: MongoClient | null = null;
    try {
        console.log('Starting data migration...');
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const db = mongoClient.db();

        // Get collections
        const oldUserProfiles = db.collection<OldUserProfile>("user_profiles");
        const oldWorkoutOptions = db.collection<OldWorkoutOptions>("workout_options");
        const users = db.collection<BaseUser>("users");
        const fitnessProfiles = db.collection<FitnessProfile>("fitness_profiles");
        const workoutRequests = db.collection<WorkoutRequest>("workout_requests");

        // Step 1: Migrate user profiles to fitness profiles
        console.log('\nMigrating user profiles to fitness profiles...');
        const oldProfiles = await oldUserProfiles.find({}).toArray();

        for (const oldProfile of oldProfiles) {
            // Create new fitness profile
            const newProfile: FitnessProfile = {
                userId: oldProfile.userId,
                ageRange: oldProfile.ageRange,
                sex: oldProfile.sex,
                fitnessLevel: oldProfile.fitnessLevel || "beginner", // Default to beginner if not set
                goals: oldProfile.goals || [],
                injuriesOrLimitations: oldProfile.injuriesOrLimitations || [],
                availableEquipment: [], // New required field, default to empty
                preferredTrainingDays: [], // New optional field, default to empty
                preferredWorkoutDuration: "medium", // New optional field, default to medium
                locationPreference: "gym", // New optional field, default to gym
                createdAt: oldProfile.createdAt,
                updatedAt: oldProfile.updatedAt
            };

            await fitnessProfiles.insertOne(newProfile);
            console.log(`Migrated fitness profile for user ${oldProfile.userId}`);
        }

        // Step 2: Migrate workout options to workout requests
        console.log('\nMigrating workout options to workout requests...');
        const oldOptions = await oldWorkoutOptions.find({}).toArray();

        for (const oldOption of oldOptions) {
            // Create new workout request
            const newRequest: WorkoutRequest = {
                requestId: uuidv4(),
                userId: oldOption.userId,
                userDescription: oldOption.userDescription,
                scalingPreference: oldOption.scaling,
                includeScalingOptions: oldOption.includeScalingOptions,
                totalAvailableTime: oldOption.totalAvailableTime ? parseInt(oldOption.totalAvailableTime) : undefined,
                workoutPlanDuration: oldOption.workoutPlanDuration ? parseInt(oldOption.workoutPlanDuration) : undefined,
                workoutFocus: oldOption.workoutFocus as WorkoutRequest['workoutFocus'],
                includeWarmups: oldOption.includeWarmups,
                includeAlternateMovements: oldOption.includeAlternateMovements,
                includeCooldown: oldOption.includeCooldown,
                includeRestDays: oldOption.includeRestDays,
                includeBenchmarkWorkouts: oldOption.includeBenchmarkWorkouts,
                outdoorWorkout: oldOption.outdoorWorkout,
                periodization: oldOption.periodization as WorkoutRequest['periodization'],
                currentWeather: oldOption.weather as WorkoutRequest['currentWeather'],
                includeExercises: oldOption.includeExercises,
                excludeExercises: oldOption.excludeExcercises,
                wodRequestTime: oldOption.wodRequestTime ? new Date(oldOption.wodRequestTime) : new Date(),
                createdAt: oldOption.createdAt || new Date(),
                updatedAt: oldOption.updatedAt || new Date()
            };

            await workoutRequests.insertOne(newRequest);
            console.log(`Migrated workout request for user ${oldOption.userId}`);
        }

        // Step 3: Verify migration
        console.log('\nVerifying migration...');
        const newProfileCount = await fitnessProfiles.countDocuments();
        const newRequestCount = await workoutRequests.countDocuments();
        const oldProfileCount = await oldUserProfiles.countDocuments();
        const oldOptionsCount = await oldWorkoutOptions.countDocuments();

        console.log('\nMigration Summary:');
        console.log(`Old user profiles: ${oldProfileCount}`);
        console.log(`New fitness profiles: ${newProfileCount}`);
        console.log(`Old workout options: ${oldOptionsCount}`);
        console.log(`New workout requests: ${newRequestCount}`);

        // Step 4: Backup old collections (optional)
        console.log('\nCreating backup of old collections...');
        const backupDb = mongoClient.db("workouts_ai_trainer_backup");

        // Copy old collections to backup database
        await db.collection("user_profiles").aggregate([
            { $out: "user_profiles_backup" }
        ]).toArray();

        await db.collection("workout_options").aggregate([
            { $out: "workout_options_backup" }
        ]).toArray();

        console.log('Backup created successfully');

        // Step 5: Drop old collections (optional)
        const shouldDropOldCollections = process.env.DROP_OLD_COLLECTIONS === 'true';
        if (shouldDropOldCollections) {
            console.log('\nDropping old collections...');
            await db.collection("user_profiles").drop();
            await db.collection("workout_options").drop();
            console.log('Old collections dropped successfully');
        }

        console.log('\nMigration completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Run the migration
migrateData(); 