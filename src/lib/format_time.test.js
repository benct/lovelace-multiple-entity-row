import { describe, expect, it } from 'vitest';
import { formatTime } from './format_time';
import { TimeFormat } from './constants';

describe('formatTime', () => {
    it('formats using 12-hour time when requested', () => {
        const date = new Date(2024, 0, 15, 13, 5);
        expect(formatTime(date, { language: 'en-US', time_format: TimeFormat.am_pm })).toMatch(/1:05\s?PM/);
    });

    it('formats using 24-hour time when requested', () => {
        const date = new Date(2024, 0, 15, 13, 5);
        expect(formatTime(date, { language: 'en-US', time_format: TimeFormat.twenty_four })).toBe('13:05');
    });
});
