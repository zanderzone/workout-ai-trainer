import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/errors';
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
    // Skip authentication if disabled
    if (!process.env.AUTH_ENABLED) {
        logAccess(req);
        next();
        return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        logAccess(req);
        throw new HttpError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // Validate provider
        if (!isValidProvider(decoded.provider)) {
            throw new HttpError('Invalid provider type', 401);
        }

        // Validate refresh token
        if (!decoded.refreshToken) {
            throw new HttpError('Invalid token: missing refresh token', 401);
        }

        // Create a BaseUser object from the JWT payload
        const user: BaseUser = {
            providerId: decoded.providerId,
            email: decoded.email,
            provider: decoded.provider,
            refreshToken: decoded.refreshToken,
            tokenExpiresAt: decoded.tokenExpiresAt ? new Date(decoded.tokenExpiresAt) : undefined,
            createdAt: new Date(), // These will be updated when we fetch the full user
            updatedAt: new Date()
        };
        req.user = user as any; // Type assertion needed due to Passport's type definition
        logAccess(req, user);
        next();
    } catch (error) {
        logAccess(req);
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError('Invalid or expired token', 401);
    }
});

export const requireRole = (roles: string[]) => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            throw new HttpError('Authentication required', 401);
        }

        // Add role-based checks here if needed
        // For now, we'll just pass through
        next();
    });
};

export const validateSession = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session) {
        throw new HttpError('Session not initialized', 401);
    }
    next();
}); 