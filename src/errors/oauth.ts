import { HttpError } from './base';

export class OAuthError extends HttpError {
    constructor(message: string, details?: any) {
        super(message, 401, details);
        this.name = 'OAuthError';
    }
}

export class AppleConfigError extends HttpError {
    constructor(message: string, details?: any) {
        super(message, 500, details);
        this.name = 'AppleConfigError';
    }
}

export class GoogleConfigError extends HttpError {
    constructor(message: string, details?: any) {
        super(message, 500, details);
        this.name = 'GoogleConfigError';
    }
} 