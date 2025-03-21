import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack);

    // Handle custom HTTP errors
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
            ...(err.details && { details: err.details })
        });
        return;
    }

    // Handle unknown errors
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}; 