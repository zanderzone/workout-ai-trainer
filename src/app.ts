import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import OpenAI from "openai";
import { connectDatabases } from "./services/database.service";

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

// JWT Authentication Middleware
const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!AUTH_ENABLED) {
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Invalid token" });
        }
        (req as any).user = decoded;
        next();
    });
};

// API Key Authentication Middleware
const apiKeyAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!AUTH_ENABLED) {
        return next();
    }
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey || !API_KEYS.includes(apiKey)) {
        res.status(401).json({ error: "Invalid API Key" });
        return;
    }
    next();
};

// Authentication Routes
app.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;
        const userCollection = app.locals.userCollection;
        
        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = { name, email, password: hashedPassword, createdAt: new Date() };
        const result = await userCollection.insertOne(newUser);
        
        res.json({ message: "User registered successfully", userId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const userCollection = app.locals.userCollection;
        
        const user = await userCollection.findOne({ email });
        if (!user) {
            res.status(400).json({ error: "Invalid email or password" });
            return;
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: "Invalid email or password" });
            return;
        }
        
        const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// API Routes
import userRoutes from "./routes/user.routes";
import workoutRoutes from "./routes/workout.routes";

app.use("/users", jwtAuthMiddleware, userRoutes);
app.use("/workouts", jwtAuthMiddleware, apiKeyAuthMiddleware, workoutRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
