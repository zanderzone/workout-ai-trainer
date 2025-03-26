import { describe, it, expect } from 'vitest';
import { AppError, HttpError, ValidationError, UnauthorizedError, ForbiddenError } from '../../errors/base';

describe('Base Error Classes', () => {
    describe('AppError', () => {
        it('should create AppError with correct properties', () => {
            const error = new AppError('Test error', 500);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('AppError');
            expect(error.details).toBeUndefined();
        });

        it('should create AppError with details', () => {
            const details = { field: 'test' };
            const error = new AppError('Test error', 500, details);
            expect(error.details).toEqual(details);
        });
    });

    describe('HttpError', () => {
        it('should create HttpError with correct properties', () => {
            const error = new HttpError('Test error', 404);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(404);
            expect(error.name).toBe('HttpError');
        });
    });

    describe('ValidationError', () => {
        it('should create ValidationError with correct properties', () => {
            const error = new ValidationError('Invalid input');
            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('ValidationError');
        });

        it('should create ValidationError with details', () => {
            const details = { field: 'email', message: 'Invalid email format' };
            const error = new ValidationError('Invalid input', details);
            expect(error.details).toEqual(details);
        });
    });

    describe('UnauthorizedError', () => {
        it('should create UnauthorizedError with correct properties', () => {
            const error = new UnauthorizedError('Not authenticated');
            expect(error.message).toBe('Not authenticated');
            expect(error.statusCode).toBe(401);
            expect(error.name).toBe('UnauthorizedError');
        });
    });

    describe('ForbiddenError', () => {
        it('should create ForbiddenError with correct properties', () => {
            const error = new ForbiddenError('Access denied');
            expect(error.message).toBe('Access denied');
            expect(error.statusCode).toBe(403);
            expect(error.name).toBe('ForbiddenError');
        });
    });
}); 