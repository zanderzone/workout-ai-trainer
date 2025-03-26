/**
 * Base error class for application errors
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Custom error class for HTTP errors
 */
export class HttpError extends AppError {
    constructor(
        message: string,
        statusCode: number,
        details?: any
    ) {
        super(message, statusCode, details);
        this.name = 'HttpError';
    }
}

export class ValidationError extends HttpError {
    constructor(message: string, details?: any) {
        super(message, 400, details);
        this.name = 'ValidationError';
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