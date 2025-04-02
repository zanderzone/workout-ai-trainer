import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'workout_ai_trainer_test' : (process.env.DB_NAME || 'workout_ai_trainer');

// Define the collections we want to truncate, matching the ones in database.service.ts
const COLLECTIONS_TO_TRUNCATE = ['users', 'fitness_profiles', 'workout_requests', 'wods'] as const;

async function truncateDatabase() {
    let mongoClient: MongoClient | null = null;
    try {
        // Connect to MongoDB
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        mongoClient = new MongoClient(MONGO_URI, {
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
        });

        await mongoClient.connect();
        console.log('Connected to MongoDB successfully');

        const mongoDb = mongoClient.db(DB_NAME);
        console.log(`Using database: ${DB_NAME}`);

        // Get all collection names
        const collections = await mongoDb.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);
        console.log('Available collections:', collectionNames);

        let totalDeleted = 0;
        const results: { collection: string; deleted: number; error?: string }[] = [];

        // Truncate each collection
        for (const collectionName of COLLECTIONS_TO_TRUNCATE) {
            try {
                if (collectionNames.includes(collectionName)) {
                    const result = await mongoDb.collection(collectionName).deleteMany({});
                    totalDeleted += result.deletedCount;
                    results.push({
                        collection: collectionName,
                        deleted: result.deletedCount
                    });
                    console.log(`Truncated collection "${collectionName}": ${result.deletedCount} documents deleted`);
                } else {
                    results.push({
                        collection: collectionName,
                        deleted: 0,
                        error: 'Collection not found'
                    });
                    console.log(`Collection "${collectionName}" not found, skipping...`);
                }
            } catch (error) {
                results.push({
                    collection: collectionName,
                    deleted: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
                console.error(`Error truncating collection "${collectionName}":`, error);
            }
        }

        // Print summary
        console.log('\nTruncation Summary:');
        console.log('------------------');
        results.forEach(result => {
            const status = result.error ? `Error: ${result.error}` : `${result.deleted} documents deleted`;
            console.log(`${result.collection}: ${status}`);
        });
        console.log('------------------');
        console.log(`Total documents deleted: ${totalDeleted}`);

    } catch (error) {
        console.error('Error truncating database:', error);
        process.exit(1);
    } finally {
        // Close the connection
        if (mongoClient) {
            try {
                await mongoClient.close();
                console.log('MongoDB connection closed');
            } catch (error) {
                console.error('Error closing MongoDB connection:', error);
            }
        }
    }
}

// Run the truncation
console.log('Starting database truncation...');
truncateDatabase().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 