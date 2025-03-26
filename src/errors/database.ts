import { AppError } from './base';

export class DatabaseError extends AppError {
    constructor(message: string, public readonly originalError?: any) {
        super(message, 500);
        this.name = 'DatabaseError';
    }
}

export class DatabaseConnectionError extends DatabaseError {
    constructor(message: string = 'Database connection failed', originalError?: any) {
        super(message, originalError);
        this.name = 'DatabaseConnectionError';
        this.statusCode = 503;
    }
}

export class DatabaseOperationError extends DatabaseError {
    constructor(message: string, public readonly originalError?: any) {
        super(message, originalError);
        this.name = 'DatabaseOperationError';
    }
}

// Error handling utilities
export function handleDatabaseError(error: unknown): never {
    if (error instanceof DatabaseError) {
        throw error;
    }

    if (error instanceof Error) {
        throw new DatabaseError(error.message, error);
    }

    throw new DatabaseError('An unknown database error occurred', error);
}

// Error response formatting
export function formatDatabaseErrorResponse(error: unknown): {
    status: number;
    message: string;
    error?: any;
} {
    if (error instanceof DatabaseConnectionError) {
        return {
            status: 503,
            message: 'Database service is temporarily unavailable',
            error: error.originalError
        };
    }

    if (error instanceof DatabaseOperationError) {
        return {
            status: 500,
            message: 'Database operation failed',
            error: error.originalError
        };
    }

    if (error instanceof DatabaseError) {
        return {
            status: 500,
            message: error.message,
            error: error.originalError
        };
    }

    return {
        status: 500,
        message: 'An unexpected database error occurred',
        error: error
    };
} 