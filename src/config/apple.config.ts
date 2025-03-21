import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

console.log('Current working directory:', process.cwd());

const privateKeyPath = path.join(process.cwd(), 'config', 'keys', 'apple-auth-key.p8');
console.log('Using private key path:', privateKeyPath);

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

export const appleConfig = {
  clientId: process.env.APPLE_CLIENT_ID || 'com.workout-ai-trainer.app',
  teamId: process.env.APPLE_TEAM_ID,
  keyId: process.env.APPLE_KEY_ID,
  privateKey,
  privateKeyLocation: privateKeyPath,
  callbackUrl: process.env.APPLE_CALLBACK_URL || 'https://workout-ai-trainer.ngrok.io/auth/apple/callback',
  scope: ['name', 'email'],
  state: process.env.APPLE_STATE || 'apple-auth-state',
};

// Validate required configuration
const requiredFields = ['teamId', 'keyId', 'privateKey'];
for (const field of requiredFields) {
  if (!appleConfig[field as keyof typeof appleConfig]) {
    throw new Error(`Missing required Apple Sign-In configuration: ${field}`);
  }
} 