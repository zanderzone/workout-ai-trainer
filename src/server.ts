import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import { connectDatabases, closeDatabaseConnection } from './services/database.service';
import { DatabaseConnectionError, handleDatabaseConnectionError, logDatabaseError } from './utils/error-handling';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify required environment variables
const requiredEnvVars = [
    'APPLE_CLIENT_ID',
    'APPLE_TEAM_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY_PATH',
    'APPLE_CALLBACK_URL',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 3000;

// Validate OAuth configuration
function validateOAuthConfig() {
    const googleConfig = {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    };

    const appleConfig = {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
        callbackURL: process.env.APPLE_CALLBACK_URL,
    };

    const missingGoogleVars = Object.entries(googleConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    const missingAppleVars = Object.entries(appleConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingGoogleVars.length > 0) {
        console.error('Missing Google OAuth configuration:', missingGoogleVars.join(', '));
    }

    if (missingAppleVars.length > 0) {
        console.error('Missing Apple OAuth configuration:', missingAppleVars.join(', '));
    }
}

// Start server function
async function startServer() {
    try {
        // Connect to databases
        await connectDatabases(app);

        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Closing server...');
            await closeDatabaseConnection();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT received. Closing server...');
            await closeDatabaseConnection();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        logDatabaseError(error, 'startServer');
        handleDatabaseConnectionError(error);
    }
}

// Validate OAuth config before starting server
validateOAuthConfig();

// Start the server
startServer(); 