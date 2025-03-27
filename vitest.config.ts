import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.config.ts',
                'dist/'
            ]
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        onUnhandledRejection: (err) => {
            // Ignore OpenAIRateLimitError in tests as these are expected in retry tests
            if (err.name === 'OpenAIRateLimitError') {
                return false;
            }
            return true;
        }
    }
});

