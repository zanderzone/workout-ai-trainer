import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User, BaseUser } from "./types/user.types";
import dotenv from "dotenv";
import { Collection } from "mongodb";
import { appleConfig } from "./config/apple.config";

dotenv.config();

// User serialization
passport.serializeUser((user: BaseUser, done) => done(null, user));
passport.deserializeUser((obj: BaseUser, done) => done(null, obj));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const userCollection: Collection<User> = (global as any).userCollection;
            if (!userCollection) {
                throw new Error('Database connection not initialized');
            }

            // Check if user exists
            let user = await userCollection.findOne({ email: profile.emails?.[0].value });

            if (!user) {
                // Create new user
                const newUser: BaseUser = {
                    providerId: profile.id,
                    email: profile.emails?.[0].value!,
                    provider: 'google',
                    firstName: profile.name?.givenName,
                    lastName: profile.name?.familyName,
                    profilePicture: profile.photos?.[0].value,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await userCollection.insertOne(newUser as User);
                user = result as unknown as User;
            }

            return done(null, user);
        } catch (error) {
            return done(error as Error);
        }
    }
));

// Apple OAuth Strategy
passport.use(new AppleStrategy(
    {
        clientID: appleConfig.clientId!,
        teamID: appleConfig.teamId!,
        keyID: appleConfig.keyId!,
        privateKeyLocation: appleConfig.privateKeyLocation!,
        callbackURL: appleConfig.callbackUrl!,
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
        try {
            const userCollection: Collection<User> = (global as any).userCollection;
            if (!userCollection) {
                throw new Error('Database connection not initialized');
            }

            const decodedToken = jwt.decode(idToken) as { email: string };
            const email = decodedToken.email;

            // Check if user exists
            let user = await userCollection.findOne({ email });

            if (!user) {
                // Create new user
                const newUser: BaseUser = {
                    providerId: profile.id,
                    email,
                    provider: 'apple',
                    firstName: profile.name?.firstName,
                    lastName: profile.name?.lastName,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await userCollection.insertOne(newUser as User);
                user = newUser as User;
            }

            return done(null, user);
        } catch (error) {
            return done(error as Error);
        }
    }
));

// Generate JWT for user
export function generateToken(user: BaseUser) {
    return jwt.sign(
        {
            providerId: user.providerId,
            email: user.email,
            provider: user.provider,
            refreshToken: user.refreshToken,
            tokenExpiresAt: user.tokenExpiresAt
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );
}

// Middleware to protect routes
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    if (!process.env.AUTH_ENABLED) {
        next();
        return;
    }

    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        (req as any).user = decoded;
        next();
    });
}
