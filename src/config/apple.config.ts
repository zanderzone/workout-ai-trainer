import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

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
  /** State parameter for CSRF protection */
  state: string;
  /** OAuth scopes */
  scope: readonly ['name', 'email'];
}

/**
 * Error messages for Apple configuration
 */
const APPLE_CONFIG_MESSAGES = {
  MISSING_ENV: 'Missing required environment variables for Apple Sign In:',
  INVALID_KEY_PATH: 'Invalid private key path:',
  KEY_READ_ERROR: 'Failed to read private key file:',
  INVALID_KEY_FORMAT: 'Invalid private key format. Must be a valid PEM file.'
} as const;

/**
 * Loads and validates the private key from the specified path
 * @param keyPath - Path to the private key file
 * @returns The private key content
 * @throws Error if the key cannot be loaded or is invalid
 */
function loadPrivateKey(keyPath: string): string {
  try {
    const absolutePath = join(process.cwd(), keyPath);
    const keyContent = readFileSync(absolutePath, 'utf8');

    if (!keyContent.includes('-----BEGIN PRIVATE KEY-----') ||
      !keyContent.includes('-----END PRIVATE KEY-----')) {
      throw new Error(APPLE_CONFIG_MESSAGES.INVALID_KEY_FORMAT);
    }

    return keyContent;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${APPLE_CONFIG_MESSAGES.KEY_READ_ERROR} ${error.message}`);
    }
    throw error;
  }
}

/**
 * Loads and validates Apple Sign In configuration from environment variables
 * @returns The Apple Sign In configuration
 * @throws Error if required configuration is missing or invalid
 */
export function loadAppleConfig(): AppleConfig {
  const requiredEnvVars = {
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_SERVICES_ID: process.env.APPLE_SERVICES_ID,
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_KEY_ID: process.env.APPLE_KEY_ID,
    APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH,
    APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL
  } as const;

  // Log raw environment variables for debugging
  console.log('Raw environment variables:', requiredEnvVars);

  // Check for missing variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`${APPLE_CONFIG_MESSAGES.MISSING_ENV} ${missingVars.join(', ')}`);
  }

  // Check for placeholder values
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (value?.includes('your-apple-')) {
      throw new Error(`Environment variable ${key} contains placeholder value: ${value}`);
    }
  });

  const privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH!;
  if (!privateKeyPath) {
    throw new Error(`${APPLE_CONFIG_MESSAGES.INVALID_KEY_PATH} ${privateKeyPath}`);
  }

  const config: AppleConfig = {
    clientId: process.env.APPLE_CLIENT_ID!,
    servicesId: process.env.APPLE_SERVICES_ID!,
    teamId: process.env.APPLE_TEAM_ID!,
    keyId: process.env.APPLE_KEY_ID!,
    privateKey: loadPrivateKey(privateKeyPath),
    callbackUrl: process.env.APPLE_CALLBACK_URL!,
    state: '',
    scope: ['name', 'email']
  };

  // Log configuration details (excluding sensitive data)
  console.log('Apple Sign In Configuration:', {
    clientId: config.clientId,
    servicesId: config.servicesId,
    teamId: config.teamId,
    keyId: config.keyId,
    callbackUrl: config.callbackUrl,
    privateKeyPresent: !!config.privateKey
  });

  return config;
}

// Export the configuration
export const appleConfig = loadAppleConfig(); 