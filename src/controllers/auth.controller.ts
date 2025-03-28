import { Request, Response } from 'express';
import { generateToken } from '../auth';
import { appleConfig, generateState } from '../config/apple.config';
import { googleConfig } from '../config/google.config';
import { BaseUser } from '../types/user.types';
import { exchangeGoogleToken, exchangeAppleToken, getUserInfo, AppleUserInfo } from '../utils/oauth';
import { CustomSession } from '../types/session.types';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import debug from 'debug';
import { AppleAuthClient } from '../utils/appleAuthClient';
import { DatabaseManager } from '../utils/databaseManager';

const debugAuth = debug('auth:controller');

type RequestWithSession = Request & { session: CustomSession };

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

        console.log('Google OAuth Request URL:', authUrl.toString());
        console.log('Google OAuth Parameters:', {
            clientId: googleConfig.clientId ? 'present' : 'missing',
            callbackUrl: googleConfig.callbackUrl,
            scope,
            state
        });

        // Set a cookie to verify the state parameter
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60 * 1000 // 5 minutes
        });

        res.redirect(authUrl.toString());
    },

    googleCallback: async (req: Request, res: Response) => {
        try {
            console.log('Received callback request:', {
                query: req.query,
                cookies: req.cookies,
                headers: req.headers
            });

            const { code, state } = req.query;
            console.log('Google OAuth Callback Received:', { code, state });

            // Verify state to prevent CSRF attacks
            if (state !== googleConfig.state) {
                console.error('Invalid state parameter:', {
                    received: state,
                    expected: googleConfig.state,
                    storedState: req.cookies.oauth_state
                });
                res.status(400).json({ message: 'Invalid state parameter' });
                return;
            }

            if (!code) {
                console.error('No authorization code received');
                res.status(400).json({ message: 'No authorization code received' });
                return;
            }

            // Exchange code for tokens and get user info
            try {
                console.log('Exchanging Google authorization code for tokens...');
                const { tokens, userInfo } = await exchangeGoogleToken(code as string);
                console.log('Google token exchange successful:', {
                    accessToken: tokens.access_token ? 'present' : 'missing',
                    idToken: tokens.id_token ? 'present' : 'missing',
                    userInfo: {
                        id: userInfo.id,
                        email: userInfo.email
                    }
                });

                // Check if user exists using providerId
                const userCollection = req.app.locals.userCollection;
                console.log('Looking up user with providerId:', userInfo.id);
                const existingUser = await userCollection.findOne(
                    { providerId: userInfo.id },
                    { projection: { _id: 1, email: 1, provider: 1, isRegistrationComplete: 1, createdAt: 1 } }
                );
                console.log('Existing user lookup result:', existingUser);

                // Generate refresh token
                const refreshToken = crypto.randomBytes(40).toString('hex');
                const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                try {
                    if (existingUser) {
                        console.log('Updating existing user');
                        // Update existing user
                        await userCollection.updateOne(
                            { providerId: userInfo.id },
                            {
                                $set: {
                                    email: userInfo.email,
                                    provider: 'google',
                                    refreshToken,
                                    tokenExpiresAt,
                                    isRegistrationComplete: existingUser.isRegistrationComplete || false,
                                    updatedAt: new Date()
                                }
                            }
                        );
                    } else {
                        console.log('Creating new user');
                        // Create new user
                        await userCollection.insertOne({
                            providerId: userInfo.id,
                            email: userInfo.email,
                            provider: 'google',
                            refreshToken,
                            tokenExpiresAt,
                            isRegistrationComplete: false,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                    console.log('Database operation successful');
                } catch (dbError) {
                    console.error('Database operation failed:', dbError);
                    throw dbError;
                }

                // Generate JWT token
                const token = jwt.sign(
                    {
                        providerId: userInfo.id,
                        email: userInfo.email,
                        provider: 'google',
                        refreshToken
                    },
                    process.env.JWT_SECRET!,
                    { expiresIn: '7d' }
                );

                // Redirect based on registration status
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                const redirectUrl = (!existingUser || !existingUser.isRegistrationComplete)
                    ? `${frontendUrl}/register?token=${token}`
                    : `${frontendUrl}/auth/callback?token=${token}`;

                console.log('Authentication successful, redirecting to:', redirectUrl);
                res.redirect(redirectUrl);
            } catch (error: any) {
                console.error('Google token exchange error:', error);
                if (error.message === 'Failed to exchange Google token') {
                    res.status(401).json({ message: 'Invalid authorization code' });
                    return;
                }
                throw error;
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/login?error=auth_failed`);
        }
    },

    // Apple Sign In methods
    appleAuth: (req: Request, res: Response) => {
        const state = generateState();
        const scope = appleConfig.scope.join(' ');

        const authUrl = new URL('https://appleid.apple.com/auth/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', appleConfig.servicesId);
        authUrl.searchParams.append('redirect_uri', appleConfig.callbackUrl);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('response_mode', 'form_post');

        console.log('Apple OAuth Request URL:', authUrl.toString());
        console.log('Apple OAuth Parameters:', {
            clientId: appleConfig.servicesId ? 'present' : 'missing',
            callbackUrl: appleConfig.callbackUrl,
            scope,
            state
        });

        // Set a cookie to verify the state parameter with secure settings
        res.cookie('apple_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 5 * 60 * 1000, // 5 minutes
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
        });

        res.redirect(authUrl.toString());
    },

    appleCallback: async (req: Request, res: Response) => {
        console.log('Apple OAuth callback received', {
            body: req.body,
            query: req.query,
            cookies: req.cookies
        });

        try {
            const { state, code } = req.body;

            console.log('Validating state parameter', {
                receivedState: state,
                storedState: req.cookies.apple_oauth_state
            });

            if (!state || state !== req.cookies.apple_oauth_state) {
                console.error('State parameter validation failed', {
                    receivedState: state,
                    storedState: req.cookies.apple_oauth_state,
                    cookies: req.cookies
                });
                return res.status(400).json({
                    message: 'Invalid state parameter',
                    debug: {
                        receivedState: state,
                        storedState: req.cookies.apple_oauth_state,
                        allCookies: req.cookies
                    }
                });
            }

            console.log('State parameter validated successfully');

            if (!code) {
                console.error('No authorization code received');
                return res.status(400).json({ message: 'No authorization code received' });
            }

            console.log('Starting token exchange with Apple');
            const client = new AppleAuthClient(appleConfig);

            console.log('Apple client initialized, exchanging code for token');
            const tokenResponse = await client.getAuthorizationToken(code);
            console.log('Token exchange successful', {
                hasIdToken: !!tokenResponse.id_token,
                hasAccessToken: !!tokenResponse.access_token
            });

            const decodedIdToken = jwt.decode(tokenResponse.id_token) as any;
            console.log('Decoded ID token', {
                sub: decodedIdToken?.sub,
                email: decodedIdToken?.email,
                hasEmail: !!decodedIdToken?.email
            });

            // Find or create user
            console.log('Looking up user in database');
            const db = await DatabaseManager.getInstance().getDb();
            const usersCollection = db.collection('users');

            const existingUser = await usersCollection.findOne({
                providerId: decodedIdToken.sub,
                provider: 'apple'
            });

            console.log('Database lookup complete', { userFound: !!existingUser });

            let user: BaseUser;
            if (existingUser) {
                console.log('Updating existing user');
                const updateResult = await usersCollection.updateOne(
                    { _id: existingUser._id },
                    {
                        $set: {
                            email: decodedIdToken.email,
                            refreshToken: tokenResponse.refresh_token,
                            tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                            updatedAt: new Date()
                        }
                    }
                );
                console.log('User update complete', {
                    matchedCount: updateResult.matchedCount,
                    modifiedCount: updateResult.modifiedCount
                });
                const updatedUser = await usersCollection.findOne({ _id: existingUser._id });
                if (!updatedUser) {
                    throw new Error('Failed to find updated user');
                }
                user = {
                    providerId: updatedUser.providerId,
                    email: updatedUser.email,
                    provider: updatedUser.provider,
                    refreshToken: updatedUser.refreshToken,
                    tokenExpiresAt: updatedUser.tokenExpiresAt,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                    isRegistrationComplete: updatedUser.isRegistrationComplete
                };
            } else {
                console.log('Creating new user');
                const newUser: BaseUser = {
                    providerId: decodedIdToken.sub,
                    email: decodedIdToken.email,
                    provider: 'apple',
                    refreshToken: tokenResponse.refresh_token,
                    tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isRegistrationComplete: false
                };
                const insertResult = await usersCollection.insertOne(newUser);
                console.log('New user created', {
                    success: !!insertResult.insertedId,
                    userId: insertResult.insertedId
                });
                user = newUser;
            }

            if (!user) {
                console.error('Failed to find or create user');
                return res.status(500).json({ message: 'Failed to create or update user' });
            }

            console.log('Generating JWT token');
            const token = generateToken(user);

            // Clear the state cookie with secure settings
            res.clearCookie('apple_oauth_state', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
            });

            // Redirect to frontend with token
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
            console.log('Redirecting to frontend:', redirectUrl);
            res.redirect(redirectUrl);

        } catch (error) {
            console.error('Error in Apple OAuth callback:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/login?error=auth_failed`);
        }
    },

    // Auth status check
    checkAuthStatus: async (req: Request, res: Response): Promise<void> => {
        if (req.isAuthenticated()) {
            res.json({ isAuthenticated: true, user: req.user });
        } else {
            res.json({ isAuthenticated: false });
        }
    },

    /**
     * Handles server-to-server notifications from Apple about user account changes.
     * Apple sends these notifications when users modify their Apple ID settings.
     * 
     * Handles three types of events:
     * 1. email-disabled: User has disabled email sharing for the app
     * 2. email-enabled: User has enabled email sharing for the app
     * 3. account-delete: User has revoked Sign in with Apple or deleted their Apple ID
     * 
     * @see https://developer.apple.com/documentation/sign_in_with_apple/processing_changes_for_sign_in_with_apple_accounts
     * 
     * @param req Express request object containing Apple's notification payload
     * @param res Express response object
     * @returns Promise<void>
     */
    handleAppleNotifications: async (req: Request, res: Response) => {
        try {
            console.log('Received Apple notification:', req.body);

            const { type, sub, email } = req.body.payload;
            const userCollection = req.app.locals.userCollection;

            switch (type) {
                case 'email-disabled':
                    await userCollection.updateOne(
                        { providerId: sub },
                        {
                            $set: {
                                emailVerified: false,
                                updatedAt: new Date()
                            }
                        }
                    );
                    break;

                case 'email-enabled':
                    await userCollection.updateOne(
                        { providerId: sub },
                        {
                            $set: {
                                email,
                                emailVerified: true,
                                updatedAt: new Date()
                            }
                        }
                    );
                    break;

                case 'account-delete':
                    await userCollection.updateOne(
                        { providerId: sub },
                        {
                            $set: {
                                accountStatus: 'disabled',
                                updatedAt: new Date()
                            }
                        }
                    );
                    break;

                default:
                    console.log('Unhandled notification type:', type);
            }

            res.status(200).json({ status: 'success' });
        } catch (error) {
            console.error('Error processing Apple notification:', error);
            res.status(500).json({ status: 'error' });
        }
    }
}; 