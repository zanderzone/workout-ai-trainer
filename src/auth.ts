import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

// User serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
        return done(null, { id: profile.id, provider: "google", email: profile.emails?.[0].value });
    }
));

// Apple OAuth Strategy
passport.use(new AppleStrategy(
    {
        clientID: process.env.APPLE_CLIENT_ID!,
        teamID: process.env.APPLE_TEAM_ID!,
        keyID: process.env.APPLE_KEY_ID!,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH!,
        callbackURL: "/auth/apple/callback",
        passReqToCallback: true
    },
    (req, accessToken, refreshToken, idToken, profile, done) => {
        const decodedToken = jwt.decode(idToken) as { email: string };
        return done(null, { id: profile.id, provider: "apple", email: decodedToken.email });
    }
));

// Generate JWT for user
export function generateToken(user: any) {
    return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: "7d" });
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

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}
