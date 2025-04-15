import { useState, useCallback } from 'react';
import { AppError, ErrorType, mapApiError } from '@/lib/error';
import { AxiosError } from 'axios';

interface UseApiErrorReturn {
    error: AppError | null;
    setError: (error: AppError | null) => void;
    handleApiError: (error: unknown) => void;
    clearError: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function useApiError(): UseApiErrorReturn {
    const [error, setError] = useState<AppError | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleApiError = useCallback((error: unknown) => {
        if (error instanceof AxiosError) {
            setError(mapApiError(error));
        } else if (error instanceof Error) {
            setError({
                type: ErrorType.UNKNOWN_ERROR,
                message: error.message,
                originalError: error
            });
        } else {
            setError({
                type: ErrorType.UNKNOWN_ERROR,
                message: 'An unexpected error occurred',
                originalError: error as Error
            });
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        setError,
        handleApiError,
        clearError,
        isLoading,
        setIsLoading
    };
} 