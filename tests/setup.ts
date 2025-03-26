import { beforeAll, afterAll, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Create Express app
export const app = express();
app.use(express.json());

// Mock middleware
const mockAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            statusCode: 401
        });
    }
    const token = authHeader.split(' ')[1];
    if (token === 'invalid-token') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Token validation failed',
            statusCode: 401
        });
    }
    next();
};

// Mock router
const mockWodRouter = express.Router();
mockWodRouter.post('/', (req, res) => {
    const { userId, workoutOptions, testScenario } = req.body;

    // Test scenarios for different error cases
    if (testScenario) {
        switch (testScenario) {
            case 'rate-limit':
                res.setHeader('retry-after', '60');
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Too many requests',
                    statusCode: 429
                });
            case 'invalid-options':
                return res.status(400).json({
                    error: 'Invalid Input',
                    message: 'Invalid workout options provided',
                    statusCode: 400
                });
            case 'openai-error':
                return res.status(500).json({
                    error: 'OpenAI API Error',
                    message: 'Failed to generate workout plan',
                    statusCode: 500
                });
            case 'database-error':
                return res.status(500).json({
                    error: 'Database Error',
                    message: 'Failed to save workout plan',
                    statusCode: 500
                });
        }
    }

    // Validate required fields
    if (!userId || !workoutOptions) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Missing required fields',
            statusCode: 400
        });
    }

    // Validate workout options
    const requiredOptions = ['fitnessLevel', 'workoutDuration', 'workoutType', 'equipment', 'goals'];
    const missingOptions = requiredOptions.filter(option => !workoutOptions[option]);
    if (missingOptions.length > 0) {
        return res.status(400).json({
            error: 'Invalid Input',
            message: `Missing required workout options: ${missingOptions.join(', ')}`,
            statusCode: 400
        });
    }

    // Return mock workout plan
    return res.status(200).json({
        workoutId: `test-workout-${Date.now()}`,
        workoutPlan: {
            workoutProgramDescription: "Comprehensive 4-week plan",
            workoutPlanDuration: "4 weeks",
            workoutPlanType: "Concurrent Periodization",
            workoutPlan: [
                { week: 1, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Squats", reps: "5x5" }] } }] },
                { week: 2, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Deadlifts", reps: "3x5" }] } }] },
                { week: 3, days: [{ day: 1, workout: { type: "Conditioning", exercises: [{ exercise: "Rowing", distance: "500m" }] } }] },
                { week: 4, days: [{ day: 1, workout: { type: "Mobility", exercises: [{ exercise: "Stretching", duration: "15 min" }] } }] }
            ]
        }
    });
});

mockWodRouter.get('/:id', (req, res) => {
    const { id } = req.params;
    if (!id || id === 'invalid') {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Workout not found',
            statusCode: 404
        });
    }

    return res.status(200).json({
        workoutId: id,
        workoutPlan: {
            workoutProgramDescription: "Comprehensive 4-week plan",
            workoutPlanDuration: "4 weeks",
            workoutPlanType: "Concurrent Periodization",
            workoutPlan: [
                { week: 1, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Squats", reps: "5x5" }] } }] },
                { week: 2, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Deadlifts", reps: "3x5" }] } }] },
                { week: 3, days: [{ day: 1, workout: { type: "Conditioning", exercises: [{ exercise: "Rowing", distance: "500m" }] } }] },
                { week: 4, days: [{ day: 1, workout: { type: "Mobility", exercises: [{ exercise: "Stretching", duration: "15 min" }] } }] }
            ]
        }
    });
});

app.use(mockAuthMiddleware);
app.use('/api/wod', mockWodRouter);

// Create HTTP server
export const server = createServer(app);

// Mock environment variables for testing
process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
process.env.APPLE_SERVICES_ID = 'test.app.signin.service';
process.env.APPLE_TEAM_ID = 'test-apple-team-id';
process.env.APPLE_KEY_ID = 'test-apple-key-id';
process.env.APPLE_PRIVATE_KEY_PATH = path.join(__dirname, 'mock-private-key.p8');
process.env.APPLE_CALLBACK_URL = 'http://localhost:3000/api/auth/apple/callback';

// Mock OpenAI API
vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    usage: { completion_tokens: 2365 },
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    workoutProgramDescription: "Comprehensive 4-week plan",
                                    workoutPlanDuration: "4 weeks",
                                    workoutPlanType: "Concurrent Periodization",
                                    workoutPlan: [
                                        { week: 1, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Squats", reps: "5x5" }] } }] },
                                        { week: 2, days: [{ day: 1, workout: { type: "Strength Training", exercises: [{ exercise: "Deadlifts", reps: "3x5" }] } }] },
                                        { week: 3, days: [{ day: 1, workout: { type: "Conditioning", exercises: [{ exercise: "Rowing", distance: "500m" }] } }] },
                                        { week: 4, days: [{ day: 1, workout: { type: "Mobility", exercises: [{ exercise: "Stretching", duration: "15 min" }] } }] }
                                    ],
                                    continuationToken: {
                                        token: "2365",
                                        currentWeek: 1,
                                        missingDays: [],
                                        missingWeeks: [],
                                        nextWeek: 5
                                    }
                                })
                            }
                        }
                    ]
                })
            }
        }
    }))
}));

// Mock Apple OAuth
vi.mock('jsonwebtoken', () => {
    const mockJwt = {
        sign: vi.fn().mockReturnValue('mock.jwt.token'),
        verify: vi.fn().mockReturnValue({ sub: 'test-user-id' })
    };
    return {
        ...mockJwt,
        default: mockJwt
    };
});

// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-api-key';

let mongod: MongoMemoryServer;

// Global test setup
beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
});

// Global test cleanup
afterAll(async () => {
    // Clean up MongoDB Memory Server
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
}); 