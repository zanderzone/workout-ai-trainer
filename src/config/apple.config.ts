import path from 'path';
import fs from 'fs';

// Debug environment variables
console.log('Apple environment variables:', {
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID,
  APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL,
  APPLE_PRIVATE_KEY_PATH: process.env.APPLE_PRIVATE_KEY_PATH
});

// Load private key
const privateKeyPath = process.env.APPLE_PRIVATE_KEY_PATH!;
console.log('Using private key path:', privateKeyPath);

let privateKey: string;
try {
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(`Private key file not found at: ${privateKeyPath}`);
  }

  // Read the raw key and ensure proper PEM format
  const rawKey = fs.readFileSync(privateKeyPath, 'utf-8');

  // Clean up the key and ensure proper line breaks
  privateKey = rawKey
    .replace(/^\s+|\s+$/g, '') // Remove leading/trailing whitespace
    .replace(/\r\n/g, '\n') // Normalize line endings to \n
    .replace(/\n{2,}/g, '\n') // Replace multiple newlines with single newlines
    .replace(/([^-\n])\n(?!-)/g, '$1\n') // Ensure line breaks between key content
    .trim();

  // Verify the key has the correct format
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: Missing BEGIN header');
  }
  if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: Missing END footer');
  }

  // Log key format details (without exposing the key content)
  const keyLines = privateKey.split('\n');
  console.log('Private key format verification:', {
    hasHeader: keyLines[0] === '-----BEGIN PRIVATE KEY-----',
    hasFooter: keyLines[keyLines.length - 1] === '-----END PRIVATE KEY-----',
    totalLines: keyLines.length,
    approximateLength: privateKey.length,
    path: privateKeyPath
  });

  console.log('Successfully loaded Apple private key');
} catch (error) {
  console.error('Failed to load Apple private key:', error);
  throw error;
}

// Export strongly typed configuration
interface AppleConfig {
  clientId: string;
  servicesId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  privateKeyLocation: string;
  callbackUrl: string;
  scope: readonly ['name', 'email'];
  state: string;
}

export const appleConfig: AppleConfig = {
  clientId: process.env.APPLE_CLIENT_ID!,
  servicesId: 'com.workout-ai-trainer.app.signin.service',
  teamId: process.env.APPLE_TEAM_ID!,
  keyId: process.env.APPLE_KEY_ID!,
  privateKey,
  privateKeyLocation: privateKeyPath,
  callbackUrl: process.env.APPLE_CALLBACK_URL!,
  scope: ['name', 'email'] as const,
  state: process.env.APPLE_STATE || 'apple-auth-state'
};

// Log configuration (without sensitive data)
console.log('Apple Sign In Configuration:', {
  clientId: appleConfig.clientId,
  servicesId: appleConfig.servicesId,
  teamId: appleConfig.teamId,
  keyId: appleConfig.keyId,
  callbackUrl: appleConfig.callbackUrl,
  scope: appleConfig.scope,
  state: appleConfig.state,
  privateKeyPresent: !!appleConfig.privateKey
}); 