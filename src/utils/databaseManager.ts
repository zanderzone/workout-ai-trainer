import { MongoClient, Db } from 'mongodb';

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
} 