import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env file from:', envPath);

try {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
        console.error('Error loading .env file:', result.error);
        process.exit(1);
    }

    // Verify the environment variables were loaded correctly
    const requiredVars = [
        'APPLE_CLIENT_ID',
        'APPLE_TEAM_ID',
        'APPLE_KEY_ID',
        'APPLE_PRIVATE_KEY_PATH',
        'APPLE_CALLBACK_URL'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        process.exit(1);
    }

    // Log loaded environment variables for debugging
    console.log('Loaded environment variables:', {
        APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
        APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
        APPLE_KEY_ID: process.env.APPLE_KEY_ID,
        APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH,
        APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL
    });

} catch (error) {
    console.error('Failed to load environment variables:', error);
    process.exit(1);
}

// Import other modules after environment variables are loaded
import app from './app';
import { connectDatabases } from './services/database.service';
import { validateGoogleConfig, validateAppleConfig } from './controllers/health.controller';

const port = process.env.PORT || 3000;

// Validate OAuth configuration on startup
function validateOAuthConfig() {
    console.log('Validating OAuth configuration...');

    // Google OAuth is required
    const googleConfigValid = validateGoogleConfig();
    if (googleConfigValid.status === 'misconfigured') {
        console.error('Google OAuth configuration error:', googleConfigValid.message);
        process.exit(1);
    }
    console.log('Google OAuth configuration validated');

    // Apple Sign In is optional
    const appleConfigValid = validateAppleConfig();
    if (appleConfigValid.status === 'misconfigured') {
        console.warn('Apple Sign In configuration incomplete:', appleConfigValid.message);
        console.warn('Apple Sign In will be disabled');
    } else {
        console.log('Apple Sign In configuration validated');
    }
}

// Connect to MongoDB and start server
async function startServer() {
    try {
        // Validate OAuth configuration before connecting to database
        validateOAuthConfig();

        // Connect to database
        await connectDatabases(app);
        console.log('Database connection established');

        // Start server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log('Health check available at /health');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 