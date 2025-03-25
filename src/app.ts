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
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error.middleware';
import { validateSession } from './middleware/auth.middleware';
import testRoutes from './routes/test.routes';
import { setupPassport } from './config/passport';
import { tokenRefreshMiddleware } from './middleware/token-refresh.middleware';
import { validateGoogleConfig, validateAppleConfig } from './controllers/health.controller';

// Load environment variables
config();

const app = express();

// Configure CORS with credentials
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        'https://appleid.apple.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.use(cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3001',
//     credentials: true
// }));

// Parse cookies
app.use(cookieParser());

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Parse JSON bodies
app.use(express.json());
// Add this line to handle form-urlencoded data (needed for Apple OAuth callback)
app.use(express.urlencoded({ extended: true }));

// Request/Response logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log('\n\U0001F50D Incoming Request:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin'],
      'host': req.headers['host']
    },
    query: req.query,
    body: req.body
  });

  // Intercept and log the response
  const originalSend = res.send;
  res.send = function(body) {
    console.log('\U0001F4E4 Outgoing Response:', {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${Date.now() - startTime}ms`,
      path: req.path,
      responseBody: typeof body === 'string' ? body.substring(0, 100) : '[Object]'
    });
    return originalSend.call(this, body);
  };

  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    const googleConfigValid = validateGoogleConfig();
    const appleConfigValid = validateAppleConfig();

    const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            oauth: {
                google: googleConfigValid,
                apple: appleConfigValid
            }
        }
    };

    res.json(response);
});

// Test endpoint for debugging request handling
app.post('/api/auth/test-callback', (req: Request, res: Response) => {
    console.log('Test callback hit');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.json({ 
        message: 'Test callback received', 
        headers: req.headers, 
        body: req.body 
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wod', wodRoutes);
app.use('/api/test', testRoutes);

// Error handling
app.use(errorHandler);

export default app;
