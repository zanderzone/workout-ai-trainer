import express, { Response } from "express";
import passport from "./config/passport";
import { setupPassport } from "./config/passport";
import { config } from "dotenv";
import wodRouter from "./routes/wod.routes";
import authRouter from "./routes/auth.routes";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error.middleware';
import testRoutes from './routes/test.routes';
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Parse cookies with appropriate settings
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret'));

// Add security headers
app.use((_, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
});

// Initialize passport (needed for OAuth flows)
app.use(passport.initialize());

// Configure Passport strategies
setupPassport();

// Parse JSON bodies
app.use(express.json());
// Add this line to handle form-urlencoded data (needed for Apple OAuth callback)
app.use(express.urlencoded({ extended: true }));

// Request/Response logging middleware
app.use((_, res, next) => {
  const startTime = Date.now();
  console.log('\n\U0001F50D Incoming Request:', {
    timestamp: new Date().toISOString(),
    method: res.req.method,
    path: res.req.path,
    headers: {
      'content-type': res.req.headers['content-type'],
      'origin': res.req.headers['origin'],
      'host': res.req.headers['host'],
      'authorization': res.req.headers.authorization ? 'Bearer token present' : 'No token'
    },
    query: res.req.query,
    body: res.req.body
  });

  // Intercept and log the response
  const originalSend = res.send;
  res.send = function (body) {
    console.log('\U0001F4E4 Outgoing Response:', {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${Date.now() - startTime}ms`,
      path: res.req.path,
      responseBody: typeof body === 'string' ? body.substring(0, 100) : '[Object]'
    });
    return originalSend.call(this, body);
  };

  next();
});

// Health check endpoint
app.get('/api/health', (_, res: Response) => {
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

// Routes
app.use('/api/auth', authRouter);
app.use('/api/wod', wodRouter);
app.use('/api/test', testRoutes);

// Error handling
app.use(errorHandler);

export default app;
