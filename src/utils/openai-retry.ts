import { OpenAIRateLimitError, OpenAIServiceUnavailableError } from '../errors/openai';

interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

const DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000,    // 30 seconds
    backoffFactor: 2
};

/**
 * Implements exponential backoff for retrying OpenAI API calls
 * @param fn The async function to retry
 * @param config Retry configuration
 * @returns The result of the function call
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error | null = null;
    let delay = finalConfig.initialDelay;

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Only retry on specific errors
            if (!(error instanceof OpenAIRateLimitError) &&
                !(error instanceof OpenAIServiceUnavailableError)) {
                throw error;
            }

            // If this was the last attempt, throw the error
            if (attempt === finalConfig.maxRetries) {
                throw error;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));

            // Increase delay for next attempt
            delay = Math.min(delay * finalConfig.backoffFactor, finalConfig.maxDelay);
        }
    }

    throw lastError;
}

/**
 * Rate limiter for OpenAI API calls
 */
export class OpenAIRateLimiter {
    private lastRequestTime: number = 0;
    private readonly minInterval: number;

    constructor(requestsPerMinute: number = 60) {
        this.minInterval = (60 * 1000) / requestsPerMinute;
    }

    /**
     * Ensures minimum time between requests
     */
    async waitForRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.minInterval) {
            await new Promise(resolve =>
                setTimeout(resolve, this.minInterval - timeSinceLastRequest)
            );
        }

        this.lastRequestTime = Date.now();
    }
} 