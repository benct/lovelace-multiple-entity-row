import { describe, expect, it } from 'vitest';
import { formatDate } from './format_date';

describe('formatDate', () => {
    it('formats a date using the given locale', () => {
        const date = new Date(2024, 0, 15);
        expect(formatDate(date, { language: 'en-US' })).toBe('January 15, 2024');
    });

    it('respects a different locale', () => {
        const date = new Date(2024, 0, 15);
        expect(formatDate(date, { language: 'de' })).toBe('15. Januar 2024');
    });
});
