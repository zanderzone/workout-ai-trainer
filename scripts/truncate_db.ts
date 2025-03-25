import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function truncateDatabase() {
    let mongoClient: MongoClient | null = null;
    try {
        // Connect to MongoDB
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        console.log('Connected to MongoDB successfully');

        const mongoDb = mongoClient.db();

        // Get all collection names
        const collections = await mongoDb.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);

        // Truncate each collection
        for (const collectionName of collectionNames) {
            const result = await mongoDb.collection(collectionName).deleteMany({});
            console.log(`Truncated collection "${collectionName}": ${result.deletedCount} documents deleted`);
        }

        console.log('\nDatabase truncated successfully!');

    } catch (error) {
        console.error('Error truncating database:', error);
        process.exit(1);
    } finally {
        // Close the connection
        if (mongoClient) {
            await mongoClient.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Run the truncate function
truncateDatabase(); 