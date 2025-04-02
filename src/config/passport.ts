import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { Request } from 'express';
import { DatabaseManager } from '../utils/databaseManager';
import { ObjectId } from 'mongodb';

// Define the Google profile type
interface GoogleProfile {
    id: string;
    displayName: string;
    name?: {
        givenName?: string;
        familyName?: string;
    };
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
}

// Define the base user type for Express
interface BaseUser {
    userId: string;
    providerId: string;
    email: string;
    emailVerified: boolean;
    provider: 'google' | 'apple';
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Extend Express User type
declare global {
    namespace Express {
        interface User extends BaseUser {
            _id?: ObjectId;
        }
    }
}

export const setupPassport = () => {
    // Configure Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/auth/google/callback'
    }, async (_accessToken, _refreshToken, profile: GoogleProfile, done: (error: any, user?: Express.User) => void) => {
        try {
            const db = await DatabaseManager.getInstance().getDb();
            const usersCollection = db.collection('users');

            // Check if user exists
            let user = await usersCollection.findOne({ email: profile.emails?.[0].value });

            if (!user) {
                // Create new user
                const newUser = {
                    userId: profile.id,
                    providerId: profile.id,
                    email: profile.emails?.[0].value!,
                    emailVerified: true,
                    provider: 'google' as const,
                    firstName: profile.name?.givenName,
                    lastName: profile.name?.familyName,
                    profilePicture: profile.photos?.[0].value,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await usersCollection.insertOne(newUser);
                user = { ...newUser, _id: result.insertedId };
            }

            return done(null, user as Express.User);
        } catch (error) {
            return done(error);
        }
    }));

    // Configure Apple Strategy
    passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID!,
        teamID: process.env.APPLE_TEAM_ID!,
        keyID: process.env.APPLE_KEY_ID!,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH!,
        callbackURL: '/api/auth/apple/callback',
        passReqToCallback: true
    }, async (_req: Request, _accessToken: string, _refreshToken: string, _idToken: string, profile: any, done: (error: any, user?: Express.User) => void) => {
        try {
            const db = await DatabaseManager.getInstance().getDb();
            const usersCollection = db.collection('users');

            // Check if user exists
            let user = await usersCollection.findOne({ providerId: profile.id });

            if (!user) {
                // Create new user
                const newUser = {
                    userId: profile.id,
                    providerId: profile.id,
                    email: profile.email,
                    emailVerified: true,
                    provider: 'apple' as const,
                    firstName: profile.name?.firstName,
                    lastName: profile.name?.lastName,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await usersCollection.insertOne(newUser);
                user = { ...newUser, _id: result.insertedId };
            }

            return done(null, user as Express.User);
        } catch (error) {
            return done(error);
        }
    }));

    // Serialize user for the session
    passport.serializeUser((user: Express.User, done) => {
        done(null, user);
    });

    // Deserialize user from the session
    passport.deserializeUser((user: Express.User, done) => {
        done(null, user);
    });
};

export default passport; 