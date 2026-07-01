import { describe, expect, it } from 'vitest';
import { secondsToDuration } from './seconds_to_duration';

describe('secondsToDuration', () => {
    it('formats hours, minutes and seconds', () => {
        expect(secondsToDuration(3661)).toBe('1:01:01');
    });

    it('formats minutes and seconds without leading hours', () => {
        expect(secondsToDuration(90)).toBe('1:30');
    });

    it('formats seconds only', () => {
        expect(secondsToDuration(5)).toBe('5');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/240 -
    // a duration of exactly 0 has no meaningful unit to render, so callers
    // must handle the null case themselves rather than displaying "null".
    it('returns null for zero seconds', () => {
        expect(secondsToDuration(0)).toBeNull();
    });
});
