import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import { config } from "dotenv";
import OpenAI from "openai";
import { connectDatabases } from "./services/database.service";
import wodRoutes from "./routes/wod.routes";
import authRoutes from "./routes/auth.routes";

config();

// Initialize Express
const app = express();
app.use(express.json());

// Database Configurations
const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY || "";
const AUTH_ENABLED: boolean = process.env.AUTH_ENABLED === "true";
const JWT_SECRET: string = process.env.JWT_SECRET || "default_secret";
const API_KEYS: string[] = (process.env.API_KEYS || "").split(",");
const SALT_ROUNDS = 10;

// Connect to databases
connectDatabases(app);

// OpenAI API
app.locals.openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
import userRoutes from "./routes/user.routes";
import workoutRoutes from "./routes/workout.routes";

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/workouts", workoutRoutes);
app.use("/wod", wodRoutes);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
