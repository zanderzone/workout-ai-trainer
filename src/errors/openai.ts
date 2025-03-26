import { AppError } from './base';

export class OpenAIError extends AppError {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly originalError?: any
    ) {
        super(message, statusCode);
        this.name = 'OpenAIError';
    }
}

export class OpenAIRateLimitError extends OpenAIError {
    constructor(message: string = 'Rate limit exceeded', originalError?: any) {
        super(message, 429, originalError);
        this.name = 'OpenAIRateLimitError';
    }
}

export class OpenAIInvalidRequestError extends OpenAIError {
    constructor(message: string = 'Invalid request to OpenAI API', originalError?: any) {
        super(message, 400, originalError);
        this.name = 'OpenAIInvalidRequestError';
    }
}

export class OpenAIServiceUnavailableError extends OpenAIError {
    constructor(message: string = 'OpenAI service is temporarily unavailable', originalError?: any) {
        super(message, 503, originalError);
        this.name = 'OpenAIServiceUnavailableError';
    }
}

export class OpenAIResponseError extends OpenAIError {
    constructor(message: string = 'Invalid response from OpenAI API', originalError?: any) {
        super(message, 500, originalError);
        this.name = 'OpenAIResponseError';
    }
}

export function handleOpenAIError(error: unknown): never {
    if (error instanceof OpenAIError) {
        throw error;
    }

    // Handle OpenAI API specific errors
    if (error && typeof error === 'object' && 'response' in error) {
        const openaiError = error as any;
        const status = openaiError.response?.status;

        switch (status) {
            case 429:
                throw new OpenAIRateLimitError('Rate limit exceeded', error);
            case 400:
                throw new OpenAIInvalidRequestError('Invalid request to OpenAI API', error);
            case 503:
                throw new OpenAIServiceUnavailableError('OpenAI service is temporarily unavailable', error);
            default:
                throw new OpenAIError(
                    openaiError.response?.data?.error?.message || 'OpenAI API error occurred',
                    status || 500,
                    error
                );
        }
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes('network')) {
        throw new OpenAIServiceUnavailableError('Network error while connecting to OpenAI API', error);
    }

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
        throw new OpenAIServiceUnavailableError('Request timeout while connecting to OpenAI API', error);
    }

    // Handle invalid response format
    if (error instanceof Error && error.message.includes('parse')) {
        throw new OpenAIResponseError('Invalid response format from OpenAI API', error);
    }

    // Default case
    throw new OpenAIError('An unexpected OpenAI API error occurred', 500, error);
}

export function formatOpenAIErrorResponse(error: unknown): {
    status: number;
    message: string;
    error?: any;
} {
    if (error instanceof OpenAIError) {
        return {
            status: error.statusCode,
            message: error.message,
            error: error.originalError
        };
    }

    return {
        status: 500,
        message: 'An unexpected OpenAI API error occurred',
        error: error
    };
} 