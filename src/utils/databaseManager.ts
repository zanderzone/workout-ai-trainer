import { MongoClient, Db, Document } from 'mongodb';
import { FitnessProfile } from '../models/fitnessProfile.models';
import { DatabaseError } from '../errors/database';

export class DatabaseManager {
    private static instance: DatabaseManager;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnecting = false;
    private connectionPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public async getDb(): Promise<Db> {
        if (this.db) {
            return this.db;
        }

        if (this.isConnecting) {
            console.log('Connection in progress, waiting for existing connection attempt');
            await this.connectionPromise;
            if (!this.db) {
                throw new Error('Database connection failed after waiting');
            }
            return this.db;
        }

        this.isConnecting = true;
        console.log('Initializing new database connection');

        try {
            this.connectionPromise = this.connect();
            await this.connectionPromise;

            if (!this.db) {
                throw new Error('Database connection failed');
            }

            return this.db;
        } finally {
            this.isConnecting = false;
            this.connectionPromise = null;
        }
    }

    private async connect(): Promise<void> {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workouts_ai_trainer';
        console.log('Connecting to MongoDB:', uri);

        try {
            this.client = await MongoClient.connect(uri);
            console.log('MongoDB connection established');

            this.db = this.client.db();
            console.log('Database selected:', this.db.databaseName);

            // Test the connection by listing collections
            const collections = await this.db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));

        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            this.client = null;
            this.db = null;
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            console.log('Disconnected from MongoDB');
        }
    }

    async updateFitnessProfile(userId: string, data: Partial<FitnessProfile>): Promise<FitnessProfile> {
        try {
            const db = await this.getDb();
            const result = await db.collection('fitness_profiles').updateOne(
                { userId },
                {
                    $set: {
                        ...data,
                        updatedAt: new Date()
                    }
                },
            );

            if (result.modifiedCount === 0) {
                throw new Error('No fitness profile found');
            }

            return await this.getFitnessProfile(userId) as FitnessProfile;
        } catch (error) {
            throw new DatabaseError('Failed to update fitness profile', error);
        }
    }

    async getFitnessProfile(userId: string): Promise<FitnessProfile | null> {
        try {
            const db = await this.getDb();
            const profile = await db.collection('fitness_profiles').findOne({ userId });

            if (!profile) {
                return null;
            }

            // Create a FitnessProfile instance
            return new FitnessProfile({
                userId: profile.userId as string,
                fitnessLevel: profile.fitnessLevel as "beginner" | "intermediate" | "advanced",
                goals: profile.goals as Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">,
                availableEquipment: profile.availableEquipment as string[],
                ageRange: profile.ageRange as "18-24" | "25-34" | "35-44" | "45-54" | "55+" | undefined,
                sex: profile.sex as "male" | "female" | "other" | undefined,
                injuriesOrLimitations: profile.injuriesOrLimitations as string[] | undefined,
                preferredTrainingDays: profile.preferredTrainingDays as Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"> | undefined,
                preferredWorkoutDuration: profile.preferredWorkoutDuration as "short" | "medium" | "long" | undefined,
                locationPreference: profile.locationPreference as "gym" | "home" | "park" | "indoor" | "outdoor" | "both" | undefined,
                createdAt: profile.createdAt as Date,
                updatedAt: profile.updatedAt as Date
            });
        } catch (error) {
            throw new DatabaseError('Failed to fetch fitness profile', error);
        }
    }

    async resetFitnessProfile(userId: string): Promise<FitnessProfile> {
        try {
            const db = await this.getDb();
            const defaultProfile = {
                userId,
                fitnessLevel: "beginner",
                goals: [],
                availableEquipment: [],
                ageRange: null,
                sex: null,
                injuriesOrLimitations: [],
                preferredTrainingDays: [],
                preferredWorkoutDuration: null,
                locationPreference: null,
                updatedAt: new Date()
            };

            // First update the document
            await db.collection('fitness_profiles').updateOne(
                { userId },
                { $set: defaultProfile }
            );

            // Then fetch the updated document
            const updatedProfile = await db.collection('fitness_profiles').findOne({ userId });

            if (!updatedProfile) {
                throw new Error('Fitness profile not found');
            }

            // Create a FitnessProfile instance
            return new FitnessProfile({
                userId: updatedProfile.userId as string,
                fitnessLevel: updatedProfile.fitnessLevel as "beginner" | "intermediate" | "advanced",
                goals: updatedProfile.goals as Array<"weight loss" | "muscle gain" | "strength" | "endurance" | "power" | "flexibility" | "general fitness">,
                availableEquipment: updatedProfile.availableEquipment as string[],
                ageRange: updatedProfile.ageRange as "18-24" | "25-34" | "35-44" | "45-54" | "55+" | undefined,
                sex: updatedProfile.sex as "male" | "female" | "other" | undefined,
                injuriesOrLimitations: updatedProfile.injuriesOrLimitations as string[] | undefined,
                preferredTrainingDays: updatedProfile.preferredTrainingDays as Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"> | undefined,
                preferredWorkoutDuration: updatedProfile.preferredWorkoutDuration as "short" | "medium" | "long" | undefined,
                locationPreference: updatedProfile.locationPreference as "gym" | "home" | "park" | "indoor" | "outdoor" | "both" | undefined,
                createdAt: updatedProfile.createdAt as Date,
                updatedAt: updatedProfile.updatedAt as Date
            });
        } catch (error) {
            throw new DatabaseError('Failed to reset fitness profile', error);
        }
    }
} 