import { AxiosError } from 'axios';

// Error types
export enum ErrorType {
    API_ERROR = 'API_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error interface
export interface AppError {
    type: ErrorType;
    message: string;
    code?: string;
    details?: Record<string, any>;
    originalError?: Error | AxiosError;
}

// API Error Response interface
export interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: Record<string, any>;
}

// Custom error class
export class AppErrorClass extends Error implements AppError {
    type: ErrorType;
    code?: string;
    details?: Record<string, any>;
    originalError?: Error | AxiosError;

    constructor(error: AppError) {
        super(error.message);
        this.name = 'AppError';
        this.type = error.type;
        this.code = error.code;
        this.details = error.details;
        this.originalError = error.originalError;
    }
}

// Error mapping function
export function mapApiError(error: AxiosError): AppError {
    if (error.response) {
        // Server responded with error
        const response = error.response.data as ApiErrorResponse;
        return {
            type: ErrorType.API_ERROR,
            message: response.message || 'An error occurred',
            code: response.code,
            details: response.details,
            originalError: error
        };
    } else if (error.request) {
        // Request was made but no response
        return {
            type: ErrorType.NETWORK_ERROR,
            message: 'No response from server',
            originalError: error
        };
    } else {
        // Something else happened
        return {
            type: ErrorType.UNKNOWN_ERROR,
            message: error.message || 'An unknown error occurred',
            originalError: error
        };
    }
}

// Error handling utility functions
export const errorUtils = {
    isApiError: (error: any): error is AppError => {
        return error && typeof error === 'object' && 'type' in error;
    },

    isValidationError: (error: AppError): boolean => {
        return error.type === ErrorType.VALIDATION_ERROR;
    },

    isAuthError: (error: AppError): boolean => {
        return error.type === ErrorType.AUTH_ERROR;
    },

    isNetworkError: (error: AppError): boolean => {
        return error.type === ErrorType.NETWORK_ERROR;
    },

    getErrorMessage: (error: AppError): string => {
        return error.message || 'An unexpected error occurred';
    },

    getErrorDetails: (error: AppError): Record<string, any> | undefined => {
        return error.details;
    }
};

// Error handling hook
export function useErrorHandler() {
    const handleError = (error: unknown): AppError => {
        if (errorUtils.isApiError(error)) {
            return error;
        }

        if (error instanceof Error) {
            return {
                type: ErrorType.UNKNOWN_ERROR,
                message: error.message,
                originalError: error
            };
        }

        return {
            type: ErrorType.UNKNOWN_ERROR,
            message: 'An unexpected error occurred',
            originalError: error as Error
        };
    };

    return { handleError };
} 