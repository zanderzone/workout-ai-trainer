import { Application } from "express";
import { MongoClient, Db, Collection, MongoClientOptions, Document } from "mongodb";
import { WodType } from "../types/wod.types";
import { User } from "../types/user.types";
import { FitnessProfile } from "../types/fitnessProfile.types";
import { WorkoutRequest } from "../types/workoutRequest.types";
import { DatabaseConnectionError, logDatabaseError } from "../errors";
import { FitnessProfileService } from "./fitnessProfile.service";
import { WorkoutRequestService } from "./workoutRequest.service";
import { WodService } from "./wod.service";
import { UserService } from "./user.service";
import { OpenAIWorkoutAdapter } from "../adapters/openai-workout.adapter";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017/workouts_ai_trainer";

// Service instances
let fitnessProfileService: FitnessProfileService;
let workoutRequestService: WorkoutRequestService;
let wodService: WodService;
let userService: UserService;

// Database connection manager
export class DatabaseManager {
  private static instance: DatabaseManager;
  private static client: MongoClient | null = null;
  private static database: Db | null = null;
  private static readonly uri: string = MONGO_URI;
  private static readonly options: MongoClientOptions = {
    maxPoolSize: 50,
    minPoolSize: 10,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
  };

  private constructor() { }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private static setupConnectionMonitoring(): void {
    if (!this.client) return;

    this.client.on('connected', () => {
      console.log('MongoDB connected');
    });

    this.client.on('error', (error: Error) => {
      console.error('MongoDB connection error:', error);
      logDatabaseError(error, 'connectionError');
    });

    this.client.on('timeout', (error: Error) => {
      console.error('MongoDB connection timeout:', error);
      logDatabaseError(error, 'connectionTimeout');
    });

    this.client.on('close', () => {
      console.log('MongoDB connection closed');
    });
  }

  private static shouldRetryConnection(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors or server selection timeout
      return error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('MongoServerSelectionError');
    }
    return false;
  }

  private static async connectWithRetry(): Promise<void> {
    const MAX_RETRIES = 5;
    const INITIAL_RETRY_DELAY = 1000; // 1 second
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        if (!this.client) {
          throw new Error('MongoClient not initialized');
        }

        await Promise.race([
          this.client.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);
        return; // Success, exit the retry loop
      } catch (error: unknown) {
        retryCount++;

        // Check if we should retry this error
        if (!this.shouldRetryConnection(error)) {
          throw error; // Don't retry if it's not a retryable error
        }

        if (retryCount === MAX_RETRIES) {
          throw new DatabaseConnectionError(
            `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`,
            error
          );
        }

        // Calculate delay with exponential backoff
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
        console.log(`Connection attempt ${retryCount} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  public static async connect(): Promise<void> {
    try {
      console.log('Attempting to connect to MongoDB at:', this.uri);
      console.log('MongoDB connection options:', this.options);

      if (!this.client) {
        console.log('Creating new MongoDB client');
        this.client = new MongoClient(this.uri, this.options);
        this.setupConnectionMonitoring();
      }

      // Check if already connected by attempting a ping
      try {
        console.log('Checking existing connection with ping...');
        await this.client.db().command({ ping: 1 });
        console.log('Already connected to MongoDB');
        // Ensure database is set even if already connected
        if (!this.database) {
          console.log('Setting database instance');
          this.database = this.client.db();
        }
        return;
      } catch (pingError) {
        console.log('Not currently connected, attempting new connection');
      }

      await this.connectWithRetry();
      this.database = this.client.db();
      console.log('Connected to MongoDB successfully');

      // Verify collections
      const collections = await this.database.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));

    } catch (error) {
      console.error('MongoDB connection error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        uri: this.uri.replace(/mongodb:\/\/[^@]*@/, 'mongodb://[hidden]@')
      });
      logDatabaseError(error, 'connect');
      throw new DatabaseConnectionError("Failed to connect to MongoDB", error);
    }
  }

  public static async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.client = null;
        this.database = null;
      } catch (error) {
        logDatabaseError(error, 'closeDatabaseConnection');
        throw new DatabaseConnectionError("Failed to close MongoDB connection", error);
      }
    }
  }

  public static getDatabase(): Db {
    if (!this.database) {
      if (!this.client) {
        throw new DatabaseConnectionError("MongoDB client not initialized");
      }
      this.database = this.client.db();
    }
    return this.database;
  }

  public static getCollection<T extends Document>(name: string): Collection<T> {
    const db = this.getDatabase();
    return db.collection<T>(name);
  }

  // Instance methods that delegate to static methods
  public async connect(): Promise<void> {
    return DatabaseManager.connect();
  }

  public async close(): Promise<void> {
    return DatabaseManager.close();
  }

  public getDatabase(): Db {
    return DatabaseManager.getDatabase();
  }

  public getCollection<T extends Document>(name: string): Collection<T> {
    return DatabaseManager.getCollection<T>(name);
  }

  public static getClient(): MongoClient | null {
    return this.client;
  }
}

// Collection initializer
class CollectionInitializer {
  static async initializeCollections(db: Db, app: Application): Promise<void> {
    try {
      // Initialize collections with proper typing
      const wodCollection = db.collection<WodType>("wods");
      // const workoutCollection = db.collection<WorkoutPlanDB>("workouts");
      const userCollection = db.collection<User>("users");
      const fitnessProfileCollection = db.collection<FitnessProfile>("fitness_profiles");
      const workoutRequestCollection = db.collection<WorkoutRequest>("workout_requests");
      // const workoutResultsCollection = db.collection<WorkoutResult>("workout_results");

      // Initialize services
      const aiAdapter = new OpenAIWorkoutAdapter();
      wodService = new WodService(wodCollection, aiAdapter);
      userService = new UserService(userCollection);
      fitnessProfileService = new FitnessProfileService(fitnessProfileCollection);
      workoutRequestService = new WorkoutRequestService(workoutRequestCollection);
      // workoutService = new WorkoutService(workoutCollection);

      // Add to app.locals
      app.locals.fitnessProfileService = fitnessProfileService;
      app.locals.workoutRequestService = workoutRequestService;
      app.locals.wodService = wodService;
      app.locals.userService = userService;
      // app.locals.workoutService = workoutService;

      // Add to global for passport strategies
      (global as any).fitnessProfileService = fitnessProfileService;
      (global as any).workoutRequestService = workoutRequestService;
      (global as any).wodService = wodService;
      (global as any).userService = userService;
      // (global as any).workoutService = workoutService;

      // Create indexes
      await this.createIndexes(db);
    } catch (error) {
      logDatabaseError(error, 'initializeCollections');
      throw error;
    }
  }

  private static async createIndexes(db: Db): Promise<void> {
    try {
      // Create indexes with background option to avoid blocking operations
      await Promise.all([
        // User indexes
        db.collection("users").createIndex(
          { providerId: 1 },
          { unique: true, name: "users_providerId_unique", background: true }
        ),
        db.collection("users").createIndex(
          { email: 1 },
          { unique: true, name: "users_email_unique", background: true }
        ),
        db.collection("users").createIndex(
          { userId: 1 },
          { unique: true, name: "users_userId_unique", background: true }
        ),

        // Fitness profile indexes
        db.collection("fitness_profiles").createIndex(
          { userId: 1 },
          { unique: true, name: "fitness_profiles_userId_unique", background: true }
        ),

        // Workout request indexes
        db.collection("workout_requests").createIndex(
          { requestId: 1 },
          { unique: true, name: "workout_requests_requestId_unique", background: true }
        ),
        db.collection("workout_requests").createIndex(
          { userId: 1, createdAt: -1 },
          { name: "workout_requests_userId_createdAt", background: true }
        ),

        // WOD indexes
        db.collection("wods").createIndex(
          { wodId: 1 },
          { unique: true, name: "wods_wodId_unique", background: true }
        ),
        db.collection("wods").createIndex(
          { userId: 1, createdAt: -1 },
          { name: "wods_userId_createdAt", background: true }
        )
        // Workout results indexes - disabled
        // db.collection("workout_results").createIndex(
        //   { user_id: 1, date: -1 },
        //   { name: "workout_results_userId_date", background: true }
        // )
      ]);
    } catch (error) {
      // Log the error but don't throw - MongoDB will handle duplicate index creation gracefully
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Some indexes already exist, continuing...');
      } else {
        logDatabaseError(error, 'createIndexes');
      }
    }
  }
}

// Export other functions
export async function connectDatabases(app: Application): Promise<void> {
  try {
    await DatabaseManager.connect();
    const db = DatabaseManager.getDatabase();
    await CollectionInitializer.initializeCollections(db, app);
  } catch (error) {
    logDatabaseError(error, 'startServer');
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await DatabaseManager.close();
}

export function getMongoClient(): MongoClient | null {
  return DatabaseManager.getClient();
}

// Export services
export { fitnessProfileService, workoutRequestService, wodService, userService };