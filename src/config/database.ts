import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

export async function connectToDatabase() {
    if (client) {
        return { client, db: client.db() };
    }

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return { client, db: client.db() };
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

export async function closeDatabase() {
    if (client) {
        await client.close();
        client = null;
    }
} 