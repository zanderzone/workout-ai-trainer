import { Collection } from 'mongodb';
import { User } from '../types/user.types';

export class UserService {
    constructor(private collection: Collection<User>) { }

    async createUser(user: Omit<User, '_id'>): Promise<User> {
        const result = await this.collection.insertOne(user as User);
        return { ...user, _id: result.insertedId } as User;
    }

    async getUserById(userId: string): Promise<User | null> {
        return this.collection.findOne({ userId });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.collection.findOne({ email });
    }

    async getUserByProviderId(providerId: string): Promise<User | null> {
        return this.collection.findOne({ providerId });
    }

    async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        const result = await this.collection.findOneAndUpdate(
            { userId },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result.value as User | null;
    }

    async deleteUser(userId: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ userId });
        return result.deletedCount > 0;
    }
} 