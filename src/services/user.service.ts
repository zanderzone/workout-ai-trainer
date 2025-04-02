import { Collection } from 'mongodb';
import { User } from '../types/user.types';
import { FitnessProfile } from '../types/fitnessProfile.types';

export class UserService {
    constructor(
        private userCollection: Collection<User>,
        private fitnessProfileCollection: Collection<FitnessProfile>
    ) { }

    async createUser(user: Omit<User, '_id'>): Promise<User> {
        const result = await this.userCollection.insertOne(user as User);
        return { ...user, _id: result.insertedId } as User;
    }

    async getUserById(userId: string): Promise<User | null> {
        return this.userCollection.findOne({ userId });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.userCollection.findOne({ email });
    }

    async getUserByProviderId(providerId: string): Promise<User | null> {
        return this.userCollection.findOne({ providerId });
    }

    async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        const result = await this.userCollection.findOneAndUpdate(
            { userId },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result.value as User | null;
    }

    async deleteUser(userId: string): Promise<boolean> {
        const result = await this.userCollection.deleteOne({ userId });
        return result.deletedCount > 0;
    }

    async getFitnessProfile(userId: string): Promise<FitnessProfile> {
        const profile = await this.fitnessProfileCollection.findOne({ userId });
        if (!profile) {
            throw new Error('Fitness profile not found for user');
        }
        return profile;
    }
} 