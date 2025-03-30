import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";
const BACKUP_DB_NAME = "workouts_ai_trainer_backup";

async function rollbackMigration() {
    let mongoClient: MongoClient | null = null;
    try {
        console.log('Starting migration rollback...');
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();

        // Get source (backup) and target databases
        const backupDb = mongoClient.db(BACKUP_DB_NAME);
        const targetDb = mongoClient.db();

        // Step 1: Verify backup exists
        const backupCollections = await backupDb.listCollections().toArray();
        const requiredBackups = ["user_profiles_backup", "workout_options_backup"];
        const missingBackups = requiredBackups.filter(
            name => !backupCollections.some(col => col.name === name)
        );

        if (missingBackups.length > 0) {
            throw new Error(`Missing backup collections: ${missingBackups.join(', ')}`);
        }

        // Step 2: Drop new collections if they exist
        console.log('\nDropping new collections...');
        const newCollections = ["fitness_profiles", "workout_requests"];
        for (const collection of newCollections) {
            try {
                await targetDb.collection(collection).drop();
                console.log(`Dropped collection: ${collection}`);
            } catch (error) {
                if (error instanceof Error && error.message.includes('does not exist')) {
                    console.log(`Collection ${collection} does not exist, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Step 3: Restore old collections
        console.log('\nRestoring old collections...');

        // Restore user_profiles
        await backupDb.collection("user_profiles_backup").aggregate([
            { $out: "user_profiles" }
        ]).toArray();
        console.log('Restored user_profiles collection');

        // Restore workout_options
        await backupDb.collection("workout_options_backup").aggregate([
            { $out: "workout_options" }
        ]).toArray();
        console.log('Restored workout_options collection');

        // Step 4: Verify restoration
        console.log('\nVerifying restoration...');
        const restoredCollections = await targetDb.listCollections().toArray();
        const restoredNames = restoredCollections.map(col => col.name);

        const requiredCollections = ["user_profiles", "workout_options"];
        const missingCollections = requiredCollections.filter(
            name => !restoredNames.includes(name)
        );

        if (missingCollections.length > 0) {
            throw new Error(`Failed to restore collections: ${missingCollections.join(', ')}`);
        }

        // Step 5: Verify document counts
        const oldProfileCount = await targetDb.collection("user_profiles").countDocuments();
        const oldOptionsCount = await targetDb.collection("workout_options").countDocuments();
        const backupProfileCount = await backupDb.collection("user_profiles_backup").countDocuments();
        const backupOptionsCount = await backupDb.collection("workout_options_backup").countDocuments();

        console.log('\nRestoration Summary:');
        console.log(`Restored user profiles: ${oldProfileCount} (backup: ${backupProfileCount})`);
        console.log(`Restored workout options: ${oldOptionsCount} (backup: ${backupOptionsCount})`);

        // Step 6: Clean up backup (optional)
        const shouldCleanupBackup = process.env.CLEANUP_BACKUP === 'true';
        if (shouldCleanupBackup) {
            console.log('\nCleaning up backup database...');
            await backupDb.dropDatabase();
            console.log('Backup database dropped successfully');
        }

        console.log('\nRollback completed successfully!');

    } catch (error) {
        console.error('Error during rollback:', error);
        process.exit(1);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Run the rollback
rollbackMigration(); 