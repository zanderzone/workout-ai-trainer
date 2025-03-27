import { AppError } from './base';

export class DatabaseError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 500, details);
        this.name = 'DatabaseError';
    }
}

export class DatabaseConnectionError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 503, details);
        this.name = 'DatabaseConnectionError';
    }
}

export class DatabaseOperationError extends DatabaseError {
    constructor(message: string, public readonly originalError?: any) {
        super(message, 500, originalError);
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
            error: error.details
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
            error: error.details
        };
    }

    return {
        status: 500,
        message: 'An unexpected database error occurred',
        error: error
    };
}

export function logDatabaseError(error: unknown, context: string): void {
    console.error(`Database Error in ${context}:`, error);
    // Add additional logging logic here if needed
} 