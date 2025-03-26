import { describe, it, expect } from 'vitest';
import {
    OpenAIError,
    OpenAIRateLimitError,
    OpenAIInvalidRequestError,
    OpenAIServiceUnavailableError,
    OpenAIResponseError,
    handleOpenAIError,
    formatOpenAIErrorResponse
} from '../../errors/openai';

describe('OpenAI Error Handling', () => {
    describe('Error Classes', () => {
        it('should create OpenAIError with correct properties', () => {
            const error = new OpenAIError('Test error', 500);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('OpenAIError');
            expect(error.originalError).toBeUndefined();
        });

        it('should create OpenAIRateLimitError with correct properties', () => {
            const error = new OpenAIRateLimitError();
            expect(error.message).toBe('Rate limit exceeded');
            expect(error.statusCode).toBe(429);
            expect(error.name).toBe('OpenAIRateLimitError');
        });

        it('should create OpenAIInvalidRequestError with correct properties', () => {
            const error = new OpenAIInvalidRequestError();
            expect(error.message).toBe('Invalid request to OpenAI API');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('OpenAIInvalidRequestError');
        });

        it('should create OpenAIServiceUnavailableError with correct properties', () => {
            const error = new OpenAIServiceUnavailableError();
            expect(error.message).toBe('OpenAI service is temporarily unavailable');
            expect(error.statusCode).toBe(503);
            expect(error.name).toBe('OpenAIServiceUnavailableError');
        });

        it('should create OpenAIResponseError with correct properties', () => {
            const error = new OpenAIResponseError();
            expect(error.message).toBe('Invalid response from OpenAI API');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('OpenAIResponseError');
        });
    });

    describe('handleOpenAIError', () => {
        it('should pass through OpenAIError instances', () => {
            const error = new OpenAIError('Test error', 500);
            expect(() => handleOpenAIError(error)).toThrow(OpenAIError);
            expect(() => handleOpenAIError(error)).toThrow('Test error');
        });

        it('should handle rate limit errors', () => {
            const error = {
                response: {
                    status: 429,
                    data: { error: { message: 'Rate limit exceeded' } }
                }
            };
            expect(() => handleOpenAIError(error)).toThrow(OpenAIRateLimitError);
        });

        it('should handle invalid request errors', () => {
            const error = {
                response: {
                    status: 400,
                    data: { error: { message: 'Invalid request' } }
                }
            };
            expect(() => handleOpenAIError(error)).toThrow(OpenAIInvalidRequestError);
        });

        it('should handle service unavailable errors', () => {
            const error = {
                response: {
                    status: 503,
                    data: { error: { message: 'Service unavailable' } }
                }
            };
            expect(() => handleOpenAIError(error)).toThrow(OpenAIServiceUnavailableError);
        });

        it('should handle network errors', () => {
            const error = new Error('Network error occurred');
            expect(() => handleOpenAIError(error)).toThrow(OpenAIServiceUnavailableError);
        });

        it('should handle timeout errors', () => {
            const error = new Error('Request timeout');
            expect(() => handleOpenAIError(error)).toThrow(OpenAIServiceUnavailableError);
        });

        it('should handle parse errors', () => {
            const error = new Error('Failed to parse response');
            expect(() => handleOpenAIError(error)).toThrow(OpenAIResponseError);
        });

        it('should handle unknown errors', () => {
            const error = new Error('Unknown error');
            expect(() => handleOpenAIError(error)).toThrow(OpenAIError);
        });
    });

    describe('formatOpenAIErrorResponse', () => {
        it('should format OpenAIError correctly', () => {
            const error = new OpenAIError('Test error', 500);
            const response = formatOpenAIErrorResponse(error);
            expect(response).toEqual({
                status: 500,
                message: 'Test error',
                error: undefined
            });
        });

        it('should format unknown errors correctly', () => {
            const error = new Error('Unknown error');
            const response = formatOpenAIErrorResponse(error);
            expect(response).toEqual({
                status: 500,
                message: 'An unexpected OpenAI API error occurred',
                error: error
            });
        });
    });
}); 