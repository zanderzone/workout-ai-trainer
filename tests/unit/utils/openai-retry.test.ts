import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, OpenAIRateLimiter } from '../../../src/utils/openai-retry';
import { OpenAIRateLimitError, OpenAIServiceUnavailableError } from '../../../src/errors/openai';

describe('OpenAI Retry Utilities', () => {
    describe('withRetry', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should succeed on first try', async () => {
            const fn = vi.fn().mockResolvedValue('success');
            const result = await withRetry(fn);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on rate limit error', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new OpenAIRateLimitError('Rate limit'))
                .mockResolvedValueOnce('success');

            const promise = withRetry(fn);
            await vi.runAllTimersAsync();
            const result = await promise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should retry on service unavailable error', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new OpenAIServiceUnavailableError('Service unavailable'))
                .mockResolvedValueOnce('success');

            const promise = withRetry(fn);
            await vi.runAllTimersAsync();
            const result = await promise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should not retry on other errors', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('Other error'));
            await expect(withRetry(fn)).rejects.toThrow('Other error');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should respect max retries', async () => {
            const fn = vi.fn()
                .mockRejectedValue(new OpenAIRateLimitError('Rate limit'));

            const minConfig = {
                maxRetries: 1,  // Only try once
                initialDelay: 10, // Very short delay
                maxDelay: 10,
                backoffFactor: 1
            };

            try {
                await withRetry(fn, minConfig);
            } catch (error) {
                expect(error).toBeInstanceOf(OpenAIRateLimitError);
                expect(fn).toHaveBeenCalledTimes(1);  // Should be called just once
            }
        });

        it('should use exponential backoff', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new OpenAIRateLimitError('Rate limit'))
                .mockRejectedValueOnce(new OpenAIRateLimitError('Rate limit'))
                .mockResolvedValueOnce('success');

            const promise = withRetry(fn);
            await vi.runAllTimersAsync();
            const result = await promise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });
    });

    describe('OpenAIRateLimiter', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should allow requests within rate limit', async () => {
            const limiter = new OpenAIRateLimiter(60); // 1 request per second

            await limiter.waitForRateLimit();
            await vi.advanceTimersByTimeAsync(1000);
            await limiter.waitForRateLimit();
        });

        it('should enforce minimum interval between requests', async () => {
            const limiter = new OpenAIRateLimiter(60);

            await limiter.waitForRateLimit();
            await vi.advanceTimersByTimeAsync(500);
            const promise = limiter.waitForRateLimit();
            await vi.advanceTimersByTimeAsync(500);
            await promise;
        });

        it('should handle multiple requests correctly', async () => {
            const limiter = new OpenAIRateLimiter(60);

            for (let i = 0; i < 3; i++) {
                await limiter.waitForRateLimit();
                await vi.advanceTimersByTimeAsync(1000);
            }
        });
    });
}); 