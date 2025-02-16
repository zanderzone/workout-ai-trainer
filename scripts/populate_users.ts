import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

async function populateUsersCollection() {
    try {
        const mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        const mongoDb = mongoClient.db("workouts_ai_trainer");
        const userCollection = mongoDb.collection("users");

        const userProfiles = [
            {
                "id": uuidv4(),
                "name": {
                    "first": "Jennie",
                    "last": "de Leon"
                },
                "age": 46,
                "sex": "female",
                "weight": 180,
                "height": {
                    "feet": 5,
                    "inches": 5
                },
                "nationality": "Filipino",
                "ethnicity": "Asian",
                "healthConditions": [],
                "injuryHistory": [],
                "userPreferences": {
                    "fitnessLevel": "intermediate",
                    "preferredTrainingModality": "crossfit",
                    "trainingGoals": [
                        "muscle gain",
                        "weight loss",
                        "strength and conditioning",
                        "mobility"
                    ],
                    "availableEquipment": [
                        "45 lb barbell",
                        "35 lb barbell",
                        "dumbbells",
                        "bumper plates weight > 300 lbs",
                        "kettlebells",
                        "jump ropes",
                        "24 inch plyometric box",
                        "32 inch plyometric box",
                        "pull up bar",
                        "squat rack",
                        "assault fitness assault bike",
                        "assault fitness treadmill",
                        "concept 2 rower"
                    ],
                    "preferredExercises": [
                        "back squats",
                        "front squats",
                        "deadlifts",
                        "rowing",
                        "assault bike",
                        "clean"
                    ]
                }
            },
            {
                "id": uuidv4(),
                "name": {
                    "first": "Zander",
                    "last": "de Leon"
                },
                "age": 47,
                "sex": "male",
                "weight": 210,
                "height": {
                    "feet": 5,
                    "inches": 7
                },
                "nationality": "Filipino",
                "ethnicity": "Asian",
                "healthConditions": [
                    "asthma"
                ],
                "injuryHistory": ["rotator cuff injury"],
                "userPreferences": {
                    "fitnessLevel": "intermediate",
                    "preferredTrainingModality": "crossfit",
                    "trainingGoals": [
                        "muscle gain",
                        "athleticism",
                        "endurance",
                        "strength and conditioning"
                    ],
                    "workoutOptions": {
                        "scaling": "lighter weight or bodyweight exercises",
                        "includeScaling_options": true,
                        "workoutPlanDuration": "4 weeks",
                        "workoutDuration": "60 minutes",
                        "workoutFocus": "Strength & Conditioning",
                        "preferredTraining_days": [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday"
                        ],
                        "includeWarmups": true,
                        "includeAlternate_movements": true,
                        "includeCooldown": true,
                        "includeRestDays": true,
                        "includeBenchmarkWorkouts": true
                    },
                    "availableEquipment": [
                        "45 lb barbell",
                        "35 lb barbell",
                        "Dumbbells",
                        "Bumper Plates weight > 300 lbs",
                        "kettlebells",
                        "jump ropes",
                        "24 inch Ploymetric box",
                        "32 inch Ploymetric box",
                        "pull up bar",
                        "squat rack",
                        "Assault Fitness Assault Bike",
                        "Assault Fitness Treadmill",
                        "Concept 2 Rower"
                    ],
                    "preferredExercises": [
                        "back squats",
                        "front squats",
                        "deadlifts",
                        "rowing",
                        "assault bike",
                        "clean",
                        "power clean",
                        "clean and jerk",
                        "Power Snatch",
                        "snatch",
                        "box jumps",
                        "pull ups",
                        "push ups",
                        "dips",
                        "burpees",
                        "kettlebell swings",
                        "presses",
                        "push presses",
                        "power jerk",
                        "jerk",
                        "hang power clean",
                        "hang power snatch",
                        "weighted or unweighted alternative dumbbell lunges"
                    ]
                }
            }
        ]

        const workoutOpts =                     {
            "scaling": "lighter weight or bodyweight exercises",
            "includeScaling_options": true,
            "workoutPlanDuration": "4 weeks",
            "workoutDuration": "60 minutes",
            "workoutFocus": "Strength & Conditioning",
            "preferredTraining_days": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "includeWarmups": true,
            "includeAlternate_movements": true,
            "includeCooldown": true,
            "includeRestDays": true,
            "includeBenchmarkWorkouts": true
        };

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