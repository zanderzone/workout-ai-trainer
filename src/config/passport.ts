import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import { BaseUser } from '../types/user.types';
import { ObjectId } from 'mongodb';
import { Request } from 'express';

// Extend Express User type
declare global {
    namespace Express {
        interface User extends BaseUser {
            _id?: ObjectId;
        }
    }
}

export const setupPassport = () => {
    // Serialize user for the session
    passport.serializeUser((user: Express.User, done) => {
        done(null, user);
    });

    // Deserialize user from the session
    passport.deserializeUser((user: Express.User, done) => {
        done(null, user);
    });

    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile: GoogleProfile, done: (error: any, user?: Express.User) => void) => {
        try {
            // Here you would typically:
            // 1. Check if user exists in your database
            // 2. Create user if they don't exist
            // 3. Return the user object
            const user: Express.User = {
                providerId: profile.id,
                email: profile.emails?.[0]?.value || '',
                provider: 'google',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return done(null, user);
        } catch (error) {
            return done(error as Error);
        }
    }));

    // Apple Sign In Strategy
    passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID || '',
        teamID: process.env.APPLE_TEAM_ID || '',
        keyID: process.env.APPLE_KEY_ID || '',
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH || '',
        callbackURL: '/api/auth/apple/callback',
        passReqToCallback: true
    }, async (req: Request, accessToken: string, refreshToken: string, idToken: string, profile: any, done: (error: any, user?: Express.User) => void) => {
        try {
            // Here you would typically:
            // 1. Check if user exists in your database
            // 2. Create user if they don't exist
            // 3. Return the user object
            const user: Express.User = {
                providerId: profile.id,
                email: profile.email || '',
                provider: 'apple',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return done(null, user);
        } catch (error) {
            return done(error as Error);
        }
    }));
}; 