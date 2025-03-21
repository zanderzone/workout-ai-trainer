import dotenv from 'dotenv';

dotenv.config();

export const googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    scope: ['email', 'profile'],
    state: process.env.GOOGLE_STATE || 'google-auth-state'
}; 