import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
        ],
        exclude: [
            'frontend/**/*',
            'node_modules/**/*'
        ],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'frontend/',
            ],
        },
    },
});

