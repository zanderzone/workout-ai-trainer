import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function populateUsersCollection() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer");
        const userCollection = mongoDb.collection("users");

        const userProfiles = [
            {
                userId: uuidv4(),
                provider: "google", // Assuming Google or Apple OAuth
                ageRange: "45-54", // Age stored as a range instead of exact value
                sex: "female", // Keeping sex for workout customization
                fitnessLevel: "intermediate",
                preferredWorkoutDays: ["Monday", "Wednesday", "Friday"],
                goals: ["muscle gain", "weight loss", "strength and conditioning", "mobility"],
                equipmentAvailable: [
                    "45 lb barbell", "35 lb barbell", "dumbbells", "bumper plates weight > 300 lbs",
                    "kettlebells", "jump ropes", "24 inch plyometric box", "32 inch plyometric box",
                    "pull up bar", "squat rack", "assault fitness assault bike",
                    "assault fitness treadmill", "concept 2 rower"
                ],
                injuriesOrLimitations: [],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                userId: uuidv4(),
                provider: "apple",
                ageRange: "45-54", // Age stored as a range instead of exact value
                sex: "male", // Keeping sex for workout customization
                fitnessLevel: "intermediate",
                preferredWorkoutDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                goals: ["muscle gain", "athleticism", "endurance", "strength and conditioning"],
                equipmentAvailable: [
                    "45 lb barbell", "35 lb barbell", "Dumbbells", "Bumper Plates weight > 300 lbs",
                    "kettlebells", "jump ropes", "24 inch Plyometric box", "32 inch Plyometric box",
                    "pull up bar", "squat rack", "Assault Fitness Assault Bike",
                    "Assault Fitness Treadmill", "Concept 2 Rower"
                ],
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
