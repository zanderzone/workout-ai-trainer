import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/base';

export const errorHandler: ErrorRequestHandler = (err: Error | AppError, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            status: err.statusCode,
            ...(err.details && { details: err.details })
        });
        return;
    }

    res.status(500).json({
        error: 'Internal Server Error',
        status: 500,
        message: err.message
    });
}; 