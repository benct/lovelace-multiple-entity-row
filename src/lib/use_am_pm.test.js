import { describe, expect, it } from 'vitest';
import { useAmPm } from './use_am_pm';
import { TimeFormat } from './constants';

describe('useAmPm', () => {
    it('returns true for the 12-hour format', () => {
        expect(useAmPm({ time_format: TimeFormat.am_pm })).toBe(true);
    });

    it('returns false for the 24-hour format', () => {
        expect(useAmPm({ time_format: TimeFormat.twenty_four })).toBe(false);
    });

    it('derives am/pm usage from the language when set to "language"', () => {
        expect(useAmPm({ time_format: TimeFormat.language, language: 'en-US' })).toBe(true);
        expect(useAmPm({ time_format: TimeFormat.language, language: 'de-DE' })).toBe(false);
    });
});
