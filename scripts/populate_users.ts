import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { BaseUser } from '../src/types/user.types';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function populateUsersCollection() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer");
        const userCollection = mongoDb.collection("users");

        const userProfiles: BaseUser[] = [
            {
                providerId: uuidv4(),
                email: "test1@example.com",
                provider: "google",
                firstName: "Jane",
                lastName: "Doe",
                ageRange: "45-54",
                sex: "female",
                fitnessLevel: "intermediate",
                goals: ["muscle gain", "weight loss", "strength and conditioning", "mobility"],
                injuriesOrLimitations: [],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                providerId: uuidv4(),
                email: "test2@example.com",
                provider: "apple",
                firstName: "John",
                lastName: "Smith",
                ageRange: "45-54",
                sex: "male",
                fitnessLevel: "intermediate",
                goals: ["muscle gain", "athleticism", "endurance", "strength and conditioning"],
                injuriesOrLimitations: ["rotator cuff injury"],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Insert multiple user profiles
        await userCollection.insertMany(userProfiles);

        console.log('User profiles inserted successfully!');
        mongoClient.close();
    } catch (error) {
        console.error('Error populating users collection:', error);
    }
}

async function truncateDatabase() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer"); // Use the correct database name

        // Get all collection names
        const collections = await mongoDb.listCollections().toArray();
        const collectionNames = collections.map(collection => collection.name);

        // Truncate each collection
        for (const collectionName of collectionNames) {
            await mongoDb.collection(collectionName).deleteMany({});
            console.log(`Truncated collection: ${collectionName}`);
        }

        console.log('Database truncated successfully!');
        mongoClient.close();
    } catch (error) {
        console.error('Error truncating database:', error);
    }
}

async function displayUsers() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer"); // Use the correct database name
        const usersCollection = mongoDb.collection("users");

        // Find all users in the collection
        const users = await usersCollection.find({}).toArray();

        // Display the users
        console.log('Users:');
        users.forEach(user => console.log(user));

        mongoClient.close();
    } catch (error) {
        console.error('Error displaying users:', error);
    }
}

(async function main() {
    try {
        await truncateDatabase();
        await populateUsersCollection();
        await displayUsers();
    } catch (error) {
        console.error('Error in main script:', error);
    }
})();
