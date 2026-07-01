import { describe, expect, it } from 'vitest';
import { formatNumber, isNumericState, numberFormatToLocale, round } from './format_number';
import { NumberFormat } from './constants';

describe('round', () => {
    it('rounds to 2 decimal places by default', () => {
        expect(round(1.005)).toBe(1);
        expect(round(1.234567)).toBe(1.23);
    });

    it('rounds to the given precision', () => {
        expect(round(1.23456, 3)).toBe(1.235);
        expect(round(1.23456, 0)).toBe(1);
    });

    it('does not add trailing zeros', () => {
        expect(round(0)).toBe(0);
        expect(round(1)).toBe(1);
    });
});

describe('isNumericState', () => {
    it('is true when a unit_of_measurement is present', () => {
        expect(isNumericState({ attributes: { unit_of_measurement: '%' } })).toBe(true);
    });

    it('is true when a state_class is present', () => {
        expect(isNumericState({ attributes: { state_class: 'measurement' } })).toBe(true);
    });

    it('is false when neither is present', () => {
        expect(isNumericState({ attributes: {} })).toBe(false);
    });
});

describe('numberFormatToLocale', () => {
    it('maps comma_decimal to US English', () => {
        expect(numberFormatToLocale({ number_format: NumberFormat.comma_decimal })).toEqual(['en-US', 'en']);
    });

    it('maps decimal_comma to German with fallbacks', () => {
        expect(numberFormatToLocale({ number_format: NumberFormat.decimal_comma })).toEqual(['de', 'es', 'it']);
    });

    it('returns undefined for system format', () => {
        expect(numberFormatToLocale({ number_format: NumberFormat.system })).toBeUndefined();
    });

    it('falls back to the configured language for unknown formats', () => {
        expect(numberFormatToLocale({ number_format: NumberFormat.language, language: 'en-US' })).toBe('en-US');
    });
});

describe('formatNumber', () => {
    it('formats a number using the given locale format', () => {
        expect(formatNumber(1234.5, { number_format: NumberFormat.comma_decimal })).toBe('1,234.5');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/335 -
    // a value of exactly 0 must not gain a spurious trailing decimal.
    it('does not add a trailing decimal to zero', () => {
        expect(formatNumber(0, { number_format: NumberFormat.comma_decimal })).toBe('0');
    });

    it('preserves trailing zeros present in a string value', () => {
        expect(formatNumber('1.50', { number_format: NumberFormat.comma_decimal })).toBe('1.50');
    });

    it('passes through non-numeric strings unchanged when number_format is none', () => {
        expect(formatNumber('unknown', { number_format: NumberFormat.none })).toBe('unknown');
    });

    it('formats with currency style and appends the currency code', () => {
        expect(
            formatNumber(10, { number_format: NumberFormat.comma_decimal }, { style: 'currency', currency: 'USD' })
        ).toBe('$10.00');
    });
});
