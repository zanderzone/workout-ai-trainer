// Custom error classes for different types of errors
export class DatabaseError extends Error {
    constructor(message: string, public originalError?: any) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class DatabaseConnectionError extends DatabaseError {
    constructor(message: string, public originalError?: any) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

export class DatabaseOperationError extends DatabaseError {
    constructor(message: string, public originalError?: any) {
        super(message);
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

export function handleDatabaseConnectionError(error: unknown): never {
    if (error instanceof DatabaseConnectionError) {
        throw error;
    }

    if (error instanceof Error) {
        throw new DatabaseConnectionError(error.message, error);
    }

    throw new DatabaseConnectionError('Failed to connect to the database', error);
}

// Error logging utility
export function logDatabaseError(error: unknown, context: string): void {
    if (error instanceof DatabaseError) {
        console.error(`Database Error in ${context}:`, {
            name: error.name,
            message: error.message,
            originalError: error.originalError
        });
    } else {
        console.error(`Unknown Error in ${context}:`, error);
    }
}

// Error response formatting
export function formatErrorResponse(error: unknown): {
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
        message: 'An unexpected error occurred',
        error: error
    };
} 