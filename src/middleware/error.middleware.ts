import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/base';

export const errorHandler: ErrorRequestHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: err.statusCode,
            message: err.message,
            ...(err.details && { details: err.details })
        });
        return;
    }

    // Default error response for unhandled errors
    res.status(500).json({
        status: 500,
        message: 'Internal Server Error'
    });
}; 