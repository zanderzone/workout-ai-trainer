export class HttpError extends Error {
    constructor(
        message: string,
        public statusCode: number,
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