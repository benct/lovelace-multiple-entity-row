import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.js'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.js'],
            exclude: ['src/**/*.test.js'],
        },
    },
});
