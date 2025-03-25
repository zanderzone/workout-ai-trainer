import { Application } from "express";
import { MongoClient, Db, Collection, ObjectId, WithId } from "mongodb";
import { workoutResultSchema, WorkoutPlanDB, workoutPlanDBSchema, WorkoutResult } from "../types/workout.types";
import { wodValidationSchema, WodType, wodMongoSchema } from "../types/wod.types";
import { User } from "../types/user.types";
import { UserProfile, userProfileSchema, userProfileMongoSchema } from "../types/userProfile.types";
import { WorkoutOptions, WorkoutOptionsSchema } from "../types/workoutOptions.types";
import { generateUuid } from "../utils/uuid";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

// MongoDB client instance
let mongoClient: MongoClient;

// Collection references with proper typing
let wodCollection: Collection<WodType>;
let workoutCollection: Collection<WorkoutPlanDB>;
let userCollection: Collection<User>;
let userProfileCollection: Collection<UserProfile>;
let workoutOptionsCollection: Collection<WorkoutOptions>;
let workoutResultsCollection: Collection<WorkoutResult>;

// Custom error class for database operations
class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function connectDatabases(app: Application): Promise<void> {
  try {
    // Create MongoDB client with connection pooling
    mongoClient = new MongoClient(MONGO_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    // Connect to MongoDB
    await mongoClient.connect();
    const db = mongoClient.db();

    // Initialize collections with proper typing
    wodCollection = db.collection<WodType>("wods");
    workoutCollection = db.collection<WorkoutPlanDB>("workouts");
    userCollection = db.collection<User>("users");
    userProfileCollection = db.collection<UserProfile>("user_profiles");
    workoutOptionsCollection = db.collection<WorkoutOptions>("workout_options");
    workoutResultsCollection = db.collection<WorkoutResult>("workout_results");

    // Add collections to app.locals for global access
    app.locals.wodCollection = wodCollection;
    app.locals.workoutCollection = workoutCollection;
    app.locals.userCollection = userCollection;
    app.locals.userProfileCollection = userProfileCollection;
    app.locals.workoutOptionsCollection = workoutOptionsCollection;
    app.locals.workoutResultsCollection = workoutResultsCollection;

    // Add collections to global for passport strategies
    (global as any).wodCollection = wodCollection;
    (global as any).workoutCollection = workoutCollection;
    (global as any).userCollection = userCollection;
    (global as any).userProfileCollection = userProfileCollection;
    (global as any).workoutOptionsCollection = workoutOptionsCollection;
    (global as any).workoutResultsCollection = workoutResultsCollection;

    // Create indexes with error handling
    try {
      await Promise.all([
        userCollection.createIndex({ providerId: 1 }, { unique: true }),
        userCollection.createIndex({ email: 1 }),
        userProfileCollection.createIndex({ userId: 1 }, { unique: true }),
        workoutOptionsCollection.createIndex({ userId: 1 }, { unique: true }),
        workoutResultsCollection.createIndex({ user_id: 1, date: -1 })
      ]);
    } catch (error) {
      console.error("Error creating indexes:", error);
      // Don't throw here, as indexes can be created later
    }

    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new DatabaseError("Failed to connect to MongoDB", error);
  }
}

// Add a function to get the MongoDB client
export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new DatabaseError("MongoDB client not initialized");
  }
  return mongoClient;
}

// Add a function to close the MongoDB connection
export async function closeDatabaseConnection(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    console.log("MongoDB connection closed");
  }
}

// User Profile Management with improved error handling
export async function createUserProfile(userId: string, profile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
  try {
    const validation = userProfileSchema.safeParse({
      ...profile,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!validation.success) {
      throw new DatabaseError("Invalid user profile data", validation.error);
    }

    const result = await userProfileCollection.insertOne(validation.data);
    if (!result.acknowledged) {
      throw new DatabaseError("Failed to insert user profile");
    }

    return validation.data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("Failed to create user profile", error);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await userProfileCollection.findOne({ userId });
  return result as UserProfile | null;
}

export async function updateUserProfile(userId: string, profile: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserProfile | null> {
  const updateData = {
    ...profile,
    updatedAt: new Date()
  };

  const result = await userProfileCollection.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return result.value as UserProfile | null;
}

// Workout Options Management
export async function createWorkoutOptions(userId: string, options: Omit<WorkoutOptions, 'userId' | 'createdAt' | 'updatedAt'>): Promise<WorkoutOptions> {
  const validation = WorkoutOptionsSchema.safeParse({
    ...options,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  if (!validation.success) {
    throw new Error("Invalid workout options data");
  }

  const result = await workoutOptionsCollection.insertOne(validation.data);
  return validation.data;
}

export async function getUserWorkoutOptions(userId: string): Promise<WorkoutOptions | null> {
  const result = await workoutOptionsCollection.findOne({ userId });
  return result as WorkoutOptions | null;
}

export async function updateWorkoutOptions(userId: string, options: Partial<Omit<WorkoutOptions, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<WorkoutOptions | null> {
  const updateData = {
    ...options,
    updatedAt: new Date()
  };

  const result = await workoutOptionsCollection.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return result.value as WorkoutOptions | null;
}

// Combined User Data Management
export async function getUserCompleteData(userId: string): Promise<{
  user: any;
  profile: UserProfile | null;
  workoutOptions: WorkoutOptions | null;
}> {
  const [user, profile, workoutOptions] = await Promise.all([
    userCollection.findOne({ providerId: userId }),
    getUserProfile(userId),
    getUserWorkoutOptions(userId)
  ]);

  return { user, profile, workoutOptions };
}

export async function saveWod(wod: Omit<WodType, '_id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<void> {
  // Add metadata
  const wodWithMetadata: WodType = {
    ...wod,
    wodId: generateUuid(),
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const validation = wodValidationSchema.safeParse(wodWithMetadata);
  if (!validation.success) {
    console.error("Validation errors:", validation.error);
    throw new DatabaseError("Invalid WOD JSON structure", validation.error);
  }

  try {
    await wodCollection.insertOne(wodWithMetadata);
  } catch (error) {
    console.error("Error saving WOD:", error);
    throw new DatabaseError("Failed to save WOD to database", error);
  }
}

export async function saveWorkout(workout: Omit<WorkoutPlanDB, '_id' | 'createdAt' | 'updatedAt'>, workoutId?: string): Promise<void> {
  // Add metadata
  const workoutWithMetadata: WorkoutPlanDB = {
    ...workout,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (workoutId) {
    workoutWithMetadata._id = new ObjectId(workoutId);
  }

  // Validate the workout plan against the schema
  const validation = workoutPlanDBSchema.safeParse(workoutWithMetadata);

  if (!validation.success) {
    throw new DatabaseError("Invalid workout JSON structure", validation.error);
  }

  try {
    if (workoutId) {
      await workoutCollection.updateOne(
        { _id: new ObjectId(workoutId) },
        { $set: workoutWithMetadata }
      );
    } else {
      await workoutCollection.insertOne(workoutWithMetadata);
    }
  } catch (error) {
    throw new DatabaseError("Failed to save workout to database", error);
  }
}

// Workout Results Management with improved error handling
export async function createWorkoutResult(workoutResult: Omit<WorkoutResult, '_id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutResult> {
  try {
    const validation = workoutResultSchema.safeParse({
      ...workoutResult,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!validation.success) {
      throw new DatabaseError("Invalid workout result data", validation.error);
    }

    const result = await workoutResultsCollection.insertOne(validation.data);
    if (!result.acknowledged) {
      throw new DatabaseError("Failed to insert workout result");
    }

    return validation.data;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("Failed to create workout result", error);
  }
}

export async function getWorkoutResults(userId: string): Promise<WorkoutResult[]> {
  try {
    return await workoutResultsCollection.find({ userId }).sort({ date: -1 }).toArray();
  } catch (error) {
    throw new DatabaseError("Failed to fetch workout results", error);
  }
}

export async function getWorkoutResult(id: string): Promise<WorkoutResult | null> {
  try {
    const objectId = new ObjectId(id);
    return await workoutResultsCollection.findOne({ _id: objectId });
  } catch (error) {
    throw new DatabaseError("Failed to fetch workout result", error);
  }
}