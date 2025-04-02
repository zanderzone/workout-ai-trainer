import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Debug log to check if .env file is loaded
console.log('Environment variables loaded:', {
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID ? 'present' : 'missing',
  APPLE_SERVICES_ID: process.env.APPLE_SERVICES_ID ? 'present' : 'missing',
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID ? 'present' : 'missing',
  APPLE_KEY_ID: process.env.APPLE_KEY_ID ? 'present' : 'missing',
  APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH ? 'present' : 'missing',
  APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL ? 'present' : 'missing'
});

const appleConfigSchema = z.object({
  clientId: z.string().min(1, 'APPLE_CLIENT_ID is required'),
  servicesId: z.string().min(1, 'APPLE_SERVICES_ID is required'),
  teamId: z.string().min(1, 'APPLE_TEAM_ID is required'),
  keyId: z.string().min(1, 'APPLE_KEY_ID is required'),
  privateKey: z.string().min(1, 'APPLE_PRIVATE_KEY_PATH is required'),
  callbackUrl: z.string().min(1, 'APPLE_CALLBACK_URL is required'),
  scope: z.tuple([z.literal('name'), z.literal('email')])
});

// Read private key from file
let privateKey: string;
try {
  const keyPath = process.env.APPLE_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error('APPLE_PRIVATE_KEY_PATH is required');
  }
  privateKey = fs.readFileSync(keyPath, 'utf8');
} catch (error) {
  throw new Error(`Failed to read private key from APPLE_PRIVATE_KEY_PATH: ${error.message}`);
}

const config = {
  clientId: process.env.APPLE_CLIENT_ID,
  servicesId: process.env.APPLE_SERVICES_ID,
  teamId: process.env.APPLE_TEAM_ID,
  keyId: process.env.APPLE_KEY_ID,
  privateKey,
  callbackUrl: process.env.APPLE_CALLBACK_URL,
  scope: ['name', 'email'] as const
};

let appleConfig: z.infer<typeof appleConfigSchema>;

try {
  appleConfig = appleConfigSchema.parse(config);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => {
      const pathValue = err.path[0];
      const envVar = `APPLE_${typeof pathValue === 'string'
        ? pathValue.replace(/([A-Z])/g, '_$1').toUpperCase()
        : pathValue}`;
      return `${envVar} (${err.message})`;
    }).join(', ');
    throw new Error(
      `Missing or invalid Apple Sign In configuration. Please check your environment variables:\n${missingVars}`
    );
  }
  throw error;
}

export { appleConfig };

export function generateState(): string {
  return Math.random().toString(36).substring(7);
}

/**
 * Configuration interface for Apple Sign In
 */
export interface AppleConfig {
  /** The client ID (bundle ID) of your app */
  clientId: string;
  /** The services ID for Sign in with Apple */
  servicesId: string;
  /** Your Apple Developer Team ID */
  teamId: string;
  /** The key ID from your private key */
  keyId: string;
  /** The private key content */
  privateKey: string;
  /** The callback URL for OAuth */
  callbackUrl: string;
  /** OAuth scopes */
  scope: readonly ['name', 'email'];
} 