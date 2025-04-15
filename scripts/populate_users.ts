import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { BaseUser } from '../src/types/user.types';
import { FitnessProfile } from '../src/types/fitnessProfile.types';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'workout_ai_trainer_test' : (process.env.DB_NAME || 'workout_ai_trainer');

async function populateUsersCollection() {
    try {
        const mongoClient = new MongoClient(MONGO_URI, {
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
        });
        await mongoClient.connect();
        const mongoDb = mongoClient.db(DB_NAME);
        const userCollection = mongoDb.collection("users");
        const fitnessProfileCollection = mongoDb.collection("fitness_profiles");

        // Create test users
        const testUsers: BaseUser[] = [
            {
                userId: uuidv4(),
                providerId: uuidv4(),
                email: "home.gym.crossfitter@example.com",
                provider: "google",
                emailVerified: true,
                firstName: "Zander",
                lastName: "de Leon",
                displayName: "Zander de Leon",
                profilePicture: "https://example.com/sarah.jpg",
                accountStatus: "active",
                isRegistrationComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: uuidv4(),
                providerId: uuidv4(),
                email: "competitive.crossfitter@example.com",
                provider: "google",
                emailVerified: true,
                firstName: "Lizandro",
                lastName: "de Leon",
                displayName: "Lizandro de Leon",
                profilePicture: "https://example.com/michael.jpg",
                accountStatus: "active",
                isRegistrationComplete: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: uuidv4(),
                providerId: uuidv4(),
                email: "intermediate.crossfitter@example.com",
                provider: "apple",
                emailVerified: true,
                firstName: "Emma",
                lastName: "Rodriguez",
                displayName: "Emma Rodriguez",
                profilePicture: "https://example.com/emma.jpg",
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
                sex: "male",
                fitnessLevel: "intermediate",
                goals: ["strength", "endurance", "power", "general fitness"],
                injuriesOrLimitations: [],
                availableEquipment: [
                    "concept 2 rower",
                    "assault bike",
                    "assault treadmill",
                    "30 lb and 52 lb kettlebells",
                    "15 to 55 lb dumbbell pairs",
                    "Over 400 lbs bumper plates",
                    "pull up bar",
                    "dip station",
                    "jump ropes",
                    "plyometric boxes (24\"/32\")",
                    "45 lb mens barbell",
                    "35 lb womens barbell"
                ],
                preferredTrainingDays: ["Monday", "Wednesday", "Friday", "Saturday"],
                locationPreference: "home",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: testUsers[1].userId,
                ageRange: "25-34",
                sex: "male",
                fitnessLevel: "advanced",
                goals: ["strength", "power", "endurance", "muscle gain"],
                injuriesOrLimitations: [],
                availableEquipment: ["full crossfit gym"],
                preferredTrainingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                preferredWorkoutDuration: "long",
                locationPreference: "gym",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: testUsers[2].userId,
                ageRange: "35-44",
                sex: "female",
                fitnessLevel: "beginner",
                goals: ["strength", "endurance", "power", "general fitness"],
                injuriesOrLimitations: [],
                availableEquipment: [
                    "barbells",
                    "plates",
                    "pull-up bar",
                    "kettlebells",
                    "dumbbells",
                    "rowing machine",
                    "treadmill",
                    "jump ropes",
                    "ply boxes",
                    "medicine balls",
                    "resistance bands"
                ],
                preferredTrainingDays: ["Monday", "Wednesday", "Friday", "Sunday"],
                preferredWorkoutDuration: "medium",
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
        const mongoClient = new MongoClient(MONGO_URI, {
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
        });
        await mongoClient.connect();
        const mongoDb = mongoClient.db(DB_NAME);

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
        const mongoClient = new MongoClient(MONGO_URI, {
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
        });
        await mongoClient.connect();
        const mongoDb = mongoClient.db(DB_NAME);
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
                    preferredTrainingDays: profile.preferredTrainingDays,
                    locationPreference: profile.locationPreference
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
