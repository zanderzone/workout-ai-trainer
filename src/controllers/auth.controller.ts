import { Request, Response } from 'express';
import { generateToken } from '../auth';
import { appleConfig } from '../config/apple.config';
import { googleConfig } from '../config/google.config';
import { BaseUser } from '../types/user.types';
import { exchangeGoogleToken, exchangeAppleToken, getUserInfo, AppleUserInfo } from '../utils/oauth';
import jwt from 'jsonwebtoken';

export const authController = {
    // Google OAuth methods
    googleAuth: (req: Request, res: Response) => {
        const state = googleConfig.state;
        const scope = googleConfig.scope.join(' ');

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', googleConfig.clientId);
        authUrl.searchParams.append('redirect_uri', googleConfig.callbackUrl);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');

        res.redirect(authUrl.toString());
    },

    googleCallback: async (req: Request, res: Response) => {
        try {
            const { code, state } = req.query;

            // Verify state to prevent CSRF attacks
            if (state !== googleConfig.state) {
                res.status(400).json({ message: 'Invalid state parameter' });
                return;
            }

            // Exchange code for tokens and get user info
            try {
                const { tokens, userInfo } = await exchangeGoogleToken(code as string);

                // Create or update user
                const user: BaseUser = {
                    providerId: userInfo.id,
                    email: userInfo.email,
                    provider: 'google',
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    profilePicture: userInfo.picture,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Save user to database
                const userCollection = req.app.locals.userCollection;
                await userCollection.updateOne(
                    { providerId: user.providerId },
                    { $set: user },
                    { upsert: true }
                );

                // Generate JWT token
                const token = generateToken(user);

                res.json({
                    token,
                    user,
                    message: 'Successfully authenticated with Google'
                });
            } catch (error: any) {
                // Handle token exchange errors
                if (error.message === 'Failed to exchange Google token') {
                    res.status(401).json({ message: 'Invalid authorization code' });
                    return;
                }
                throw error;
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            res.status(500).json({ message: 'Authentication failed' });
        }
    },

    // Apple Sign In methods
    appleAuth: (req: Request, res: Response) => {
        const state = appleConfig.state;
        const scope = appleConfig.scope.join(' ');

        const authUrl = new URL('https://appleid.apple.com/auth/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('response_mode', 'form_post');
        authUrl.searchParams.append('client_id', appleConfig.clientId);
        authUrl.searchParams.append('redirect_uri', appleConfig.callbackUrl);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', scope);

        res.redirect(authUrl.toString());
    },

    appleCallback: async (req: Request, res: Response) => {
        try {
            const { code, state } = req.body;

            // Verify state to prevent CSRF attacks
            if (state !== appleConfig.state) {
                res.status(400).json({ message: 'Invalid state parameter' });
                return;
            }

            // Exchange code for tokens and get user info
            try {
                const { tokens, userInfo } = await exchangeAppleToken(code);

                // Create or update user
                const user: BaseUser = {
                    providerId: userInfo.sub,
                    email: userInfo.email,
                    provider: 'apple',
                    firstName: userInfo.name?.firstName,
                    lastName: userInfo.name?.lastName,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                // Save user to database
                const userCollection = req.app.locals.userCollection;
                await userCollection.updateOne(
                    { providerId: user.providerId },
                    { $set: user },
                    { upsert: true }
                );

                // Generate JWT token
                const token = generateToken(user);

                res.json({
                    token,
                    user,
                    message: 'Successfully authenticated with Apple'
                });
            } catch (error: any) {
                // Handle token exchange errors
                if (error.message === 'Failed to exchange Apple token') {
                    res.status(401).json({ message: 'Invalid authorization code' });
                    return;
                }
                throw error;
            }
        } catch (error) {
            console.error('Apple Sign In error:', error);
            res.status(500).json({ message: 'Authentication failed' });
        }
    },

    // Auth status check
    checkAuthStatus: async (req: Request, res: Response): Promise<void> => {
        if (req.isAuthenticated()) {
            res.json({ isAuthenticated: true, user: req.user });
        } else {
            res.json({ isAuthenticated: false });
        }
    }
}; 