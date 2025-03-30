import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { BaseUser } from '../src/types/user.types';
import { FitnessProfile } from '../src/types/fitnessProfile.types';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function populateUsersCollection() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer");
        const userCollection = mongoDb.collection("users");
        const fitnessProfileCollection = mongoDb.collection("fitness_profiles");

        // Create test users
        const testUsers: BaseUser[] = [
            {
                userId: uuidv4(),
                providerId: uuidv4(),
                email: "test1@example.com",
                provider: "google",
                emailVerified: true,
                firstName: "Jane",
                lastName: "Doe",
                displayName: "Jane Doe",
                profilePicture: "https://example.com/jane.jpg",
                accountStatus: "active",
                isRegistrationComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: uuidv4(),
                providerId: uuidv4(),
                email: "test2@example.com",
                provider: "apple",
                emailVerified: true,
                firstName: "John",
                lastName: "Smith",
                displayName: "John Smith",
                profilePicture: "https://example.com/john.jpg",
                accountStatus: "active",
                isRegistrationComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Create corresponding fitness profiles
        const fitnessProfiles: FitnessProfile[] = [
            {
                userId: testUsers[0].userId,
                ageRange: "45-54",
                sex: "female",
                fitnessLevel: "intermediate",
                goals: ["muscle gain", "weight loss", "strength", "flexibility"],
                injuriesOrLimitations: [],
                availableEquipment: ["bodyweight", "dumbbells", "resistance bands", "yoga mat"],
                preferredTrainingDays: ["Monday", "Wednesday", "Friday"],
                preferredWorkoutDuration: "medium",
                locationPreference: "gym",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: testUsers[1].userId,
                ageRange: "35-44",
                sex: "male",
                fitnessLevel: "advanced",
                goals: ["strength", "power", "endurance"],
                injuriesOrLimitations: ["rotator cuff injury"],
                availableEquipment: ["barbell", "plates", "pull-up bar", "kettlebells"],
                preferredTrainingDays: ["Tuesday", "Thursday", "Saturday"],
                preferredWorkoutDuration: "long",
                locationPreference: "gym",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Insert users and their fitness profiles
        await userCollection.insertMany(testUsers);
        await fitnessProfileCollection.insertMany(fitnessProfiles);

        console.log('Test users and fitness profiles inserted successfully!');
        mongoClient.close();
    } catch (error) {
        console.error('Error populating collections:', error);
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
        const mongoDb = mongoClient.db("workouts_ai_trainer");
        const userCollection = mongoDb.collection("users");
        const fitnessProfileCollection = mongoDb.collection("fitness_profiles");

        // Find all users and their fitness profiles
        const users = await userCollection.find({}).toArray();
        const profiles = await fitnessProfileCollection.find({}).toArray();

        // Display the users and their profiles
        console.log('\nUsers:');
        users.forEach(user => {
            console.log('\nUser:', {
                userId: user.userId,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                provider: user.provider
            });

            const profile = profiles.find(p => p.userId === user.userId);
            if (profile) {
                console.log('Fitness Profile:', {
                    fitnessLevel: profile.fitnessLevel,
                    goals: profile.goals,
                    availableEquipment: profile.availableEquipment,
                    preferredTrainingDays: profile.preferredTrainingDays
                });
            }
        });

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
