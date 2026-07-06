import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.{js,ts}'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{js,ts}'],
            exclude: ['src/**/*.test.{js,ts}', 'src/**/*.d.ts'],
        },
    },
});
