import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError, UnauthorizedError } from '../errors/base';
import { BaseUser } from '../types/user.types';
import asyncHandler from 'express-async-handler';

interface JwtPayload {
    providerId: string;
    email: string;
    provider: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
}

// Log access attempts and patterns
const logAccess = (req: Request, user?: BaseUser) => {
    const timestamp = new Date().toISOString();
    const path = req.path;
    const method = req.method;
    const userEmail = user?.email || 'anonymous';
    const userProvider = user?.provider || 'none';

    console.log(`[${timestamp}] Access: ${method} ${path} | User: ${userEmail} (${userProvider})`);
};

// Validate provider type
const isValidProvider = (provider: string): provider is 'google' | 'apple' => {
    return provider === 'google' || provider === 'apple';
};

export const authenticateJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    console.log('Authenticating request:', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader
    });

    if (!authHeader?.startsWith('Bearer ')) {
        console.log('No Bearer token provided');
        throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
        console.log('Verifying JWT token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // Validate provider
        if (!isValidProvider(decoded.provider)) {
            console.log('Invalid provider:', decoded.provider);
            throw new UnauthorizedError('Invalid provider type');
        }

        // Create a BaseUser object from the JWT payload
        const user: BaseUser = {
            providerId: decoded.providerId,
            email: decoded.email,
            provider: decoded.provider,
            refreshToken: decoded.refreshToken,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        req.user = user;
        console.log('Authentication successful for user:', decoded.email);
        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new UnauthorizedError('Invalid or expired token');
    }
});

export const requireRole = (roles: string[]) => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // Add role-based checks here if needed
        // For now, we'll just pass through
        next();
    });
};

// Remove or comment out the validateSession middleware since we're using JWT
// export const validateSession = (req: Request, res: Response, next: NextFunction) => {
//     if (!req.isAuthenticated()) {
//         throw new UnauthorizedError('User not authenticated');
//     }
//     next();
// }; 