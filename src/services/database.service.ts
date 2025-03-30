import { Application } from "express";
import { MongoClient, Db, Collection, MongoClientOptions, Document, IndexSpecification, CreateIndexesOptions } from "mongodb";
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

const MONGO_URI: string = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.NODE_ENV === 'test' ? 'workout_ai_trainer_test' : (process.env.DB_NAME || 'workout_ai_trainer');

// Service instances
let fitnessProfileService: FitnessProfileService;
let workoutRequestService: WorkoutRequestService;
let wodService: WodService;
let userService: UserService;

const COLLECTION_NAMES = ['users', 'fitness_profiles', 'workout_requests', 'wods'] as const;

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
        await this.client.db(DB_NAME).command({ ping: 1 });
        console.log('Already connected to MongoDB');
        // Ensure database is set even if already connected
        if (!this.database) {
          console.log('Setting database instance');
          this.database = this.client.db(DB_NAME);
        }
        return;
      } catch (pingError) {
        console.log('Not currently connected, attempting new connection');
      }

      await this.connectWithRetry();
      this.database = this.client.db(DB_NAME);
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
export class CollectionInitializer {
  private static db: Db;
  private static collections: Record<string, Collection>;

  static async initializeCollections(db: Db, app: Application): Promise<void> {
    this.db = db;
    this.collections = {};

    try {
      // Drop existing collections first
      console.log('Dropping existing collections...');
      for (const collectionName of COLLECTION_NAMES) {
        await this.drop(collectionName);
      }

      // Create collections in order
      for (const collectionName of COLLECTION_NAMES) {
        await this.createCollection(collectionName);
      }

      // Create indexes
      await this.createIndex('users', { email: 1 }, { unique: true });
      await this.createIndex('users', { userId: 1 }, { unique: true });
      await this.createIndex('users', { providerId: 1 }, { unique: true });
      await this.createIndex('fitness_profiles', { userId: 1 }, { unique: true });
      await this.createIndex('workout_requests', { userId: 1 });
      await this.createIndex('wods', { userId: 1 });

      // Initialize services with typed collections
      const userCollection = this.db.collection<User>('users');
      const fitnessProfileCollection = this.db.collection<FitnessProfile>('fitness_profiles');
      const workoutRequestCollection = this.db.collection<WorkoutRequest>('workout_requests');
      const wodCollection = this.db.collection<WodType>('wods');

      // Initialize services
      fitnessProfileService = new FitnessProfileService(fitnessProfileCollection);
      workoutRequestService = new WorkoutRequestService(workoutRequestCollection);
      wodService = new WodService(wodCollection, new OpenAIWorkoutAdapter());
      userService = new UserService(userCollection);

      // Add services to app locals
      if (app && app.locals) {
        app.locals.fitnessProfileService = fitnessProfileService;
        app.locals.workoutRequestService = workoutRequestService;
        app.locals.wodService = wodService;
        app.locals.userService = userService;

        // Add services to global scope for passport strategies
        (global as any).fitnessProfileService = fitnessProfileService;
        (global as any).workoutRequestService = workoutRequestService;
        (global as any).wodService = wodService;
        (global as any).userService = userService;
      }

      console.log('Collections and services initialized successfully');
    } catch (error) {
      console.error('Error initializing collections:', error);
      throw error;
    }
  }

  private static async drop(collectionName: string): Promise<void> {
    try {
      const collection = this.db.collection(collectionName);
      await collection.drop();
      console.log(`Dropped collection: ${collectionName}`);
    } catch (error) {
      if ((error as any).code !== 26) { // Ignore "Namespace does not exist" error
        throw error;
      }
    }
  }

  private static async createCollection(collectionName: string): Promise<void> {
    try {
      await this.db.createCollection(collectionName);
      this.collections[collectionName] = this.db.collection(collectionName);
      console.log(`Created collection: ${collectionName}`);
    } catch (error) {
      if ((error as any).code !== 48) { // Ignore "Collection already exists" error
        throw error;
      }
      this.collections[collectionName] = this.db.collection(collectionName);
    }
  }

  private static async createIndex(collectionName: string, indexSpec: IndexSpecification, options: CreateIndexesOptions = {}): Promise<void> {
    try {
      await this.collections[collectionName].createIndex(indexSpec, options);
      console.log(`Created index on ${collectionName}`);
    } catch (error) {
      console.error(`Error creating index on ${collectionName}:`, error);
      throw error;
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