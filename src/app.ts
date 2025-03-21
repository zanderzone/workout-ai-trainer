import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import session from "express-session";
import { config } from "dotenv";
import OpenAI from "openai";
import { connectDatabases } from "./services/database.service";
import wodRoutes from "./routes/wod.routes";
import authRoutes from "./routes/auth.routes";
import { HttpError } from "./utils/errors";
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import { validateSession } from './middleware/auth.middleware';
import testRoutes from './routes/test.routes';
import { setupPassport } from './config/passport';
import { tokenRefreshMiddleware } from './middleware/token-refresh.middleware';

config();

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Database Configurations
const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY || "";

// Connect to databases
connectDatabases(app);

// OpenAI API
app.locals.openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

// Add token refresh middleware after passport initialization
app.use(tokenRefreshMiddleware);

// API Routes
import userRoutes from "./routes/user.routes";
import workoutRoutes from "./routes/workout.routes";

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/workouts", workoutRoutes);
app.use("/wod", wodRoutes);
app.use("/test", testRoutes);

// Error handling middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
