/**
 * Error messages for Apple configuration
 */
export const APPLE_CONFIG_MESSAGES = {
    MISSING_ENV: 'Missing required environment variables for Apple Sign In:',
    INVALID_KEY_PATH: 'Invalid private key path:',
    KEY_READ_ERROR: 'Failed to read private key file:',
    INVALID_KEY_FORMAT: 'Invalid private key format. Must be a valid PEM file.'
} as const;

/**
 * Custom error class for HTTP errors
 */
export class HttpError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends HttpError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export class DatabaseError extends HttpError {
    constructor(message: string, originalError?: any) {
        super(message, 500, originalError);
        this.name = 'DatabaseError';
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string) {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends HttpError {
    constructor(message: string) {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
} 