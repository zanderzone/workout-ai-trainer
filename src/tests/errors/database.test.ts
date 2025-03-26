import { describe, it, expect } from 'vitest';
import {
    DatabaseError,
    DatabaseConnectionError,
    DatabaseOperationError,
    handleDatabaseError,
    formatDatabaseErrorResponse
} from '../../errors/database';

describe('Database Error Handling', () => {
    describe('Error Classes', () => {
        it('should create DatabaseError with correct properties', () => {
            const error = new DatabaseError('Database error');
            expect(error.message).toBe('Database error');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('DatabaseError');
            expect(error.originalError).toBeUndefined();
        });

        it('should create DatabaseConnectionError with correct properties', () => {
            const originalError = new Error('Connection failed');
            const error = new DatabaseConnectionError('Connection error', originalError);
            expect(error.message).toBe('Connection error');
            expect(error.statusCode).toBe(503);
            expect(error.name).toBe('DatabaseConnectionError');
            expect(error.originalError).toBe(originalError);
        });

        it('should create DatabaseOperationError with correct properties', () => {
            const originalError = new Error('Operation failed');
            const error = new DatabaseOperationError('Operation error', originalError);
            expect(error.message).toBe('Operation error');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('DatabaseOperationError');
            expect(error.originalError).toBe(originalError);
        });
    });

    describe('handleDatabaseError', () => {
        it('should pass through DatabaseError instances', () => {
            const error = new DatabaseError('Test error');
            expect(() => handleDatabaseError(error)).toThrow(DatabaseError);
            expect(() => handleDatabaseError(error)).toThrow('Test error');
        });

        it('should wrap Error instances in DatabaseError', () => {
            const originalError = new Error('Test error');
            expect(() => handleDatabaseError(originalError)).toThrow(DatabaseError);
            expect(() => handleDatabaseError(originalError)).toThrow('Test error');
        });

        it('should handle unknown error types', () => {
            const unknownError = 'string error';
            expect(() => handleDatabaseError(unknownError)).toThrow(DatabaseError);
            expect(() => handleDatabaseError(unknownError)).toThrow('An unknown database error occurred');
        });
    });

    describe('formatDatabaseErrorResponse', () => {
        it('should format DatabaseConnectionError correctly', () => {
            const error = new DatabaseConnectionError('Connection error');
            const response = formatDatabaseErrorResponse(error);
            expect(response).toEqual({
                status: 503,
                message: 'Database service is temporarily unavailable',
                error: undefined
            });
        });

        it('should format DatabaseOperationError correctly', () => {
            const error = new DatabaseOperationError('Operation error');
            const response = formatDatabaseErrorResponse(error);
            expect(response).toEqual({
                status: 500,
                message: 'Database operation failed',
                error: undefined
            });
        });

        it('should format DatabaseError correctly', () => {
            const error = new DatabaseError('Test error');
            const response = formatDatabaseErrorResponse(error);
            expect(response).toEqual({
                status: 500,
                message: 'Test error',
                error: undefined
            });
        });

        it('should format unknown errors correctly', () => {
            const error = new Error('Unknown error');
            const response = formatDatabaseErrorResponse(error);
            expect(response).toEqual({
                status: 500,
                message: 'An unexpected database error occurred',
                error: error
            });
        });
    });
}); 