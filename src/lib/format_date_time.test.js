import { describe, expect, it } from 'vitest';
import { formatDateTime } from './format_date_time';
import { TimeFormat } from './constants';

describe('formatDateTime', () => {
    it('formats date and time together using 24-hour time', () => {
        const date = new Date(2024, 0, 15, 13, 5);
        expect(formatDateTime(date, { language: 'en-US', time_format: TimeFormat.twenty_four })).toMatch(
            /January 15, 2024.*13:05/
        );
    });

    it('formats date and time together using 12-hour time', () => {
        const date = new Date(2024, 0, 15, 13, 5);
        expect(formatDateTime(date, { language: 'en-US', time_format: TimeFormat.am_pm })).toMatch(
            /January 15, 2024.*1:05\s?PM/
        );
    });
});
