import { describe, expect, it, vi } from 'vitest';
import { computeStateDisplay, computeStateDomain } from './compute_state_display';
import { NumberFormat, UNAVAILABLE, UNKNOWN } from './constants';

const localize = vi.fn((key) => `localized:${key}`);
const locale = { number_format: NumberFormat.comma_decimal, language: 'en-US' };

describe('computeStateDomain', () => {
    it('extracts the domain from an entity id', () => {
        expect(computeStateDomain({ entity_id: 'sensor.living_room_temperature' })).toBe('sensor');
    });
});

describe('computeStateDisplay', () => {
    it('localizes unknown and unavailable states', () => {
        const stateObj = { entity_id: 'sensor.foo', state: UNKNOWN, attributes: {} };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe(`localized:state.default.${UNKNOWN}`);

        const unavailableObj = { entity_id: 'sensor.foo', state: UNAVAILABLE, attributes: {} };
        expect(computeStateDisplay(localize, unavailableObj, locale)).toBe(`localized:state.default.${UNAVAILABLE}`);
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/307 -
    // a numeric sensor must be formatted as a number, not passed through as a raw on/off string.
    it('formats a numeric state with its unit of measurement', () => {
        const stateObj = {
            entity_id: 'sensor.temperature',
            state: '21.456',
            attributes: { unit_of_measurement: '°C' },
        };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('21.456 °C');
    });

    it('formats monetary device_class states as currency, preserving the state string precision', () => {
        const stateObj = {
            entity_id: 'sensor.balance',
            state: '10',
            attributes: { unit_of_measurement: 'USD', device_class: 'monetary', state_class: 'measurement' },
        };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('$10');
    });

    it('formats monetary device_class states preserving trailing decimals from the state string', () => {
        const stateObj = {
            entity_id: 'sensor.balance',
            state: '10.50',
            attributes: { unit_of_measurement: 'USD', device_class: 'monetary', state_class: 'measurement' },
        };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('$10.50');
    });

    it('formats counter/number/input_number domains without a unit', () => {
        const stateObj = { entity_id: 'counter.errands', state: '3', attributes: {} };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('3');
    });

    it('formats humidifier humidity as a percentage when on', () => {
        const stateObj = { entity_id: 'humidifier.bedroom', state: 'on', attributes: { humidity: 45 } };
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('45 %');
    });

    it('falls back to the raw state when no translation is found', () => {
        const stateObj = { entity_id: 'switch.lamp', state: 'on', attributes: {} };
        localize.mockReturnValueOnce('').mockReturnValueOnce('').mockReturnValueOnce('');
        expect(computeStateDisplay(localize, stateObj, locale)).toBe('on');
    });

    describe('input_datetime domain', () => {
        it('formats an explicit date-and-time state string', () => {
            const stateObj = { entity_id: 'input_datetime.event', state: '', attributes: {} };
            expect(computeStateDisplay(localize, stateObj, locale, undefined, '2024-01-15 13:05:00')).toMatch(
                /January 15, 2024.*13:05/
            );
        });

        it('formats an explicit date-only state string', () => {
            const stateObj = { entity_id: 'input_datetime.event', state: '', attributes: {} };
            expect(computeStateDisplay(localize, stateObj, locale, undefined, '2024-01-15')).toBe('January 15, 2024');
        });

        it('falls back to the raw state string if it cannot be parsed', () => {
            const stateObj = { entity_id: 'input_datetime.event', state: '', attributes: {} };
            expect(computeStateDisplay(localize, stateObj, locale, undefined, 'not-a-date')).toBe('not-a-date');
        });

        it('builds a Date from stateObj attributes when has_date and has_time are set', () => {
            const stateObj = {
                entity_id: 'input_datetime.event',
                state: '2024-01-15 13:05:00',
                attributes: { has_date: true, has_time: true, year: 2024, month: 1, day: 15, hour: 13, minute: 5 },
            };
            expect(computeStateDisplay(localize, stateObj, locale)).toMatch(/January 15, 2024.*13:05/);
        });

        it('formats a date-only stateObj when only has_date is set', () => {
            const stateObj = {
                entity_id: 'input_datetime.event',
                state: '2024-01-15',
                attributes: { has_date: true, has_time: false, year: 2024, month: 1, day: 15 },
            };
            expect(computeStateDisplay(localize, stateObj, locale)).toBe('January 15, 2024');
        });

        it('returns the raw state when neither has_date nor has_time is set', () => {
            const stateObj = {
                entity_id: 'input_datetime.event',
                state: 'raw-state',
                attributes: { has_date: false, has_time: false },
            };
            expect(computeStateDisplay(localize, stateObj, locale)).toBe('raw-state');
        });
    });

    it('formats a button/timestamp sensor as a datetime', () => {
        const stateObj = { entity_id: 'button.doorbell', state: '2024-01-15T13:05:00Z', attributes: {} };
        expect(computeStateDisplay(localize, stateObj, locale)).toMatch(/January 15, 2024/);
    });
});
