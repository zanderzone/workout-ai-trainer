import { Request, Response, NextFunction } from 'express';
import { refreshGoogleToken, refreshAppleToken, isTokenExpiringSoon } from '../utils/oauth';
import debug from 'debug';
import { BaseUser } from '../types/user.types';

const debugToken = debug('oauth:token:middleware');

export async function tokenRefreshMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // Skip if no user or no token expiry
        if (!req.user || !req.user.tokenExpiresAt) {
            return next();
        }

        const user = req.user as BaseUser;
        const tokenExpiresAt = user.tokenExpiresAt as Date;

        // Check if token needs refresh (5 minutes threshold)
        if (!isTokenExpiringSoon(tokenExpiresAt.getTime())) {
            return next();
        }

        debugToken('Token expiring soon for user %s, initiating refresh', user.email);

        // Get user collection
        const userCollection = req.app.locals.userCollection;

        // Refresh token based on provider
        try {
            let newTokens;
            if (user.provider === 'google') {
                newTokens = await refreshGoogleToken(user.refreshToken!);
            } else {
                newTokens = await refreshAppleToken(user.refreshToken!);
            }

            // Calculate new expiry time
            const tokenExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

            // Update user with new tokens (implementing token rotation)
            const updateResult = await userCollection.findOneAndUpdate(
                { providerId: user.providerId },
                {
                    $set: {
                        refreshToken: newTokens.refresh_token || user.refreshToken, // Some providers might not return new refresh token
                        tokenExpiresAt,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: 'after' }
            );

            if (!updateResult.value) {
                throw new Error('Failed to update user tokens');
            }

            // Update user in request
            req.user = {
                ...user,
                refreshToken: newTokens.refresh_token || user.refreshToken,
                tokenExpiresAt
            };

            debugToken('Successfully refreshed tokens for user %s', user.email);
        } catch (error) {
            debugToken('Error refreshing token: %O', error);
            // Don't throw error, let request continue with existing token
            // This prevents token refresh issues from breaking the app
            // The next request will try again
        }

        next();
    } catch (error) {
        debugToken('Unexpected error in token refresh middleware: %O', error);
        next(error);
    }
} 