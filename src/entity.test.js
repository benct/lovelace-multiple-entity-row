import { describe, expect, it, vi } from 'vitest';
import {
    checkEntity,
    computeEntity,
    entityName,
    entityStateDisplay,
    entityStyles,
    iconColorCss,
    stateIcon,
} from './entity';
import { NumberFormat } from './lib/constants';

// The official formatters are always present on HA 2024.4+ (the declared minimum).
const hass = {
    localize: vi.fn((key) => `localized:${key}`),
    locale: { number_format: NumberFormat.comma_decimal, language: 'en-US' },
    entities: {},
    formatEntityState: vi.fn((stateObj) => `official-state:${stateObj.state}`),
    formatEntityAttributeValue: vi.fn((stateObj, attribute) => `official-attr:${attribute}`),
};

describe('checkEntity', () => {
    it('accepts a non-blank entity id string', () => {
        expect(() => checkEntity('sensor.foo')).not.toThrow();
    });

    it('accepts an object with entity, attribute or icon set', () => {
        expect(() => checkEntity({ entity: 'sensor.foo' })).not.toThrow();
        expect(() => checkEntity({ attribute: 'battery_level' })).not.toThrow();
        expect(() => checkEntity({ icon: 'mdi:battery' })).not.toThrow();
    });

    it('throws for a blank entity id string', () => {
        expect(() => checkEntity('')).toThrow(/must not be blank/);
    });

    it('throws for an object missing entity, attribute and icon', () => {
        expect(() => checkEntity({ name: 'Foo' })).toThrow(/requires at least one/);
    });

    it('throws for any other config shape', () => {
        expect(() => checkEntity(42)).toThrow(/valid entity ID string or entity object/);
    });
});

describe('computeEntity', () => {
    it('strips the domain from an entity id', () => {
        expect(computeEntity('sensor.living_room_temperature')).toBe('living_room_temperature');
    });
});

describe('entityName', () => {
    it('returns null when name is explicitly false', () => {
        expect(entityName({}, { name: false })).toBeNull();
    });

    it('prefers the configured name', () => {
        expect(entityName({}, { name: 'Custom Name' })).toBe('Custom Name');
    });

    it('falls back to friendly_name, then the computed entity id', () => {
        const stateObj = { entity_id: 'sensor.temp', attributes: { friendly_name: 'Temperature' } };
        expect(entityName(stateObj, { entity: 'sensor.temp' })).toBe('Temperature');

        const stateObjNoFriendly = { entity_id: 'sensor.temp', attributes: {} };
        expect(entityName(stateObjNoFriendly, { entity: 'sensor.temp' })).toBe('temp');
    });

    it('returns null when there is no entity and no name', () => {
        expect(entityName({}, {})).toBeNull();
    });
});

describe('entityStateDisplay', () => {
    // See https://github.com/benct/lovelace-multiple-entity-row/issues/335 -
    // brightness format converts 0-255 to a 0-100 percentage.
    it('applies the brightness format', () => {
        const stateObj = { state: 'on', attributes: { brightness: 127.5 } };
        expect(entityStateDisplay(hass, stateObj, { attribute: 'brightness', format: 'brightness' })).toBe('50 %');
    });

    it('applies the duration format', () => {
        const stateObj = { state: '90', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'duration' })).toBe('1:30');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/323
    it('applies the percent format', () => {
        const stateObj = { state: '0.253', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'percent' })).toBe('25.3 %');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/367
    it('applies the string-transform formats', () => {
        const stateObj = { state: 'partly cloudy', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'upper' })).toBe('PARTLY CLOUDY');
        expect(entityStateDisplay(hass, stateObj, { format: 'lower' })).toBe('partly cloudy');
        expect(entityStateDisplay(hass, stateObj, { format: 'capitalize' })).toBe('Partly cloudy');
        expect(entityStateDisplay(hass, stateObj, { format: 'title' })).toBe('Partly Cloudy');
    });

    it('title-cases words starting with non-ASCII letters', () => {
        const stateObj = { state: 'über den berg', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'title' })).toBe('Über Den Berg');
    });

    it('renders a missing attribute as empty for a string transform, not "undefined"', () => {
        const stateObj = { state: 'on', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { attribute: 'missing', format: 'upper' })).toBe('');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/240 -
    // a zero duration must render as '0', not the literal string "null"
    // (secondsToDuration returns null for zero seconds by design).
    it('renders a zero duration as 0, not "null"', () => {
        const stateObj = { state: '0', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'duration' })).toBe('0');
        expect(entityStateDisplay(hass, stateObj, { format: 'duration-m' })).toBe('0');
        expect(entityStateDisplay(hass, stateObj, { format: 'duration-h' })).toBe('0');
    });

    it('applies the precision format with the requested digit count', () => {
        const stateObj = { state: '3.14159', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'precision2' })).toBe('3.14');
    });

    // A bare "precision" with no trailing digit (e.g. typed incrementally in a config editor
    // before the digit is added) must not crash with an uncaught RangeError, regardless of
    // whether the official formatter is available (see the officialHass block below for the
    // precise fallback-value assertion).
    it('does not throw for a bare "precision" format with no digit', () => {
        const stateObj = { entity_id: 'sensor.temp', state: '3.14159', attributes: {} };
        expect(() => entityStateDisplay(hass, stateObj, { format: 'precision' })).not.toThrow();
    });

    it('applies the invert format', () => {
        const stateObj = { state: '5', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'invert' })).toBe('-5');
    });

    it('applies the position format', () => {
        const stateObj = { state: '30', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'position' })).toBe('70');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/304 -
    // invert/position do arithmetic on the value before formatting, which coerces a string state
    // to a number and loses formatNumber's "preserve the source string's decimal digits" handling.
    // The formatted result must keep the same precision as the unformatted source value.
    it('preserves source precision for the invert format', () => {
        const stateObj = { state: '1.2345', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'invert' })).toBe('-1.2345');
    });

    it('preserves source precision for the position format', () => {
        const stateObj = { state: '30.5', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'position' })).toBe('69.5');
    });

    it('applies the kilo format with the default 2-decimal cap', () => {
        const stateObj = { state: '1500.256', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'kilo' })).toBe('1.5');
    });

    it('applies the mega format with the default 2-decimal cap', () => {
        const stateObj = { state: '2500000', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'mega' })).toBe('2.5');
    });

    it('applies the milli format with the default 2-decimal cap', () => {
        const stateObj = { state: '0.2', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'milli' })).toBe('200');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/304 -
    // kilo<0-9>/mega<0-9>/milli<0-9> let the user request an explicit precision instead of the
    // default 2-decimal cap. Also covers a regression in an earlier draft of this feature, which
    // parsed the trailing digit with radix 5 instead of 10 - silently breaking digits 5-9.
    it('applies kilo/mega/milli with an explicit requested precision, including digits 5-9', () => {
        const stateObj = { state: '1500.256789', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'kilo3' })).toBe('1.500');
        expect(entityStateDisplay(hass, stateObj, { format: 'kilo7' })).toBe('1.5002568');
        expect(entityStateDisplay(hass, stateObj, { format: 'mega9' })).toBe('0.001500257');
        expect(entityStateDisplay(hass, stateObj, { format: 'milli0' })).toBe('1,500,257');
    });

    // Same class of crash as the bare "precision" case above - an invalid or missing digit
    // suffix (e.g. mid-typed in a config editor) must fall back to the default, not crash.
    it('does not throw for kilo/mega/milli with an invalid digit suffix', () => {
        const stateObj = { entity_id: 'sensor.temp', state: '1500.256789', attributes: {} };
        expect(() => entityStateDisplay(hass, stateObj, { format: 'kiloX' })).not.toThrow();
        expect(() => entityStateDisplay(hass, stateObj, { format: 'megaX' })).not.toThrow();
        expect(() => entityStateDisplay(hass, stateObj, { format: 'milliX' })).not.toThrow();
    });

    it('leaves non-numeric values untouched when a format is configured', () => {
        const stateObj = { state: 'not-a-number', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'precision2' })).toBe('not-a-number');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/385 - numeric formats
    // compose comma-separated, threading the raw number and formatting once at the end.
    describe('format pipelines', () => {
        it('combines invert with an explicit precision', () => {
            const stateObj = { state: '18.123456', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'invert, precision3' })).toBe('-18.123');
        });

        it('combines kilo with an explicit precision', () => {
            const stateObj = { state: '1234.5', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'kilo, precision1' })).toBe('1.2');
        });

        it('applies an explicit precision regardless of segment order', () => {
            const stateObj = { state: '1234.5', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'precision1, kilo' })).toBe('1.2');
        });

        it('uses the digit-suffix form inside a pipeline', () => {
            const stateObj = { state: '1500', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'invert, kilo3' })).toBe('-1.500');
        });

        it('applies the last bare segment default without an explicit precision', () => {
            const stateObj = { state: '1234.5678', attributes: {} };
            // bare kilo's 2-decimal cap applies, as if kilo were used alone
            expect(entityStateDisplay(hass, stateObj, { format: 'invert, kilo' })).toBe('-1.23');
        });

        it('preserves source decimals for sign-only pipelines', () => {
            const stateObj = { state: '5.60', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'invert, position' })).toBe('105.60');
        });

        it('falls through when a segment is not a numeric transform', () => {
            const stateObj = { state: '90', attributes: {} };
            // duration cannot compose - the whole string is passed through untouched
            expect(entityStateDisplay(hass, stateObj, { format: 'duration, precision1' })).toBe('90');
        });

        it('does not crash on a mid-typed pipeline segment', () => {
            const stateObj = { state: '18.5', attributes: {} };
            expect(() => entityStateDisplay(hass, stateObj, { format: 'invert, precision' })).not.toThrow();
        });

        it('leaves non-numeric values untouched in a pipeline', () => {
            const stateObj = { state: 'on', attributes: {} };
            expect(entityStateDisplay(hass, stateObj, { format: 'invert, precision2' })).toBe('on');
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/225 -
    // a missing attribute (e.g. brightness/color_temp on a light that's off) must render as a
    // sensible zero value, not the literal string "undefined".
    it('treats a missing attribute as 0 for a numeric format, instead of "undefined"', () => {
        const stateObj = { state: 'off', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { attribute: 'brightness', format: 'brightness' })).toBe('0 %');
        expect(entityStateDisplay(hass, stateObj, { attribute: 'color_temp', format: 'precision0' })).toBe('0');
    });

    // See https://developers.home-assistant.io/docs/frontend/data#entity-state-formatting -
    // HA 2023.9+ exposes hass.formatEntityState/formatEntityAttributeValue, which apply the user's
    // own locale/precision preferences. Prefer these over our own reimplementation when present.
    describe('official formatter delegation', () => {
        const officialHass = hass;

        it('delegates unavailable-state localization to formatEntityState', () => {
            const stateObj = { state: 'unavailable', attributes: {} };
            expect(entityStateDisplay(officialHass, stateObj, {})).toBe('official-state:unavailable');
        });

        it('delegates attribute display to formatEntityAttributeValue', () => {
            const stateObj = { state: 'on', attributes: { battery_level: 42 } };
            expect(entityStateDisplay(officialHass, stateObj, { attribute: 'battery_level' })).toBe(
                'official-attr:battery_level'
            );
        });

        it('delegates main state display to formatEntityState', () => {
            const stateObj = { entity_id: 'sensor.temp', state: '21', attributes: {} };
            expect(entityStateDisplay(officialHass, stateObj, {})).toBe('official-state:21');
        });

        // See #387 - a bare "precision" (no default of its own) or an invalid digit suffix
        // (e.g. mid-typed in a config editor) is treated as no format configured for this
        // render, falling through to the official per-entity formatter rather than crashing or
        // guessing at a fallback precision of our own.
        it('falls through to the official formatter for an incomplete digit-suffix format', () => {
            const stateObj = { entity_id: 'sensor.temp', state: '21', attributes: {} };
            expect(entityStateDisplay(officialHass, stateObj, { format: 'precision' })).toBe('official-state:21');
            expect(entityStateDisplay(officialHass, stateObj, { format: 'kiloX' })).toBe('official-state:21');
        });

        it('still applies a custom format instead of the official formatters', () => {
            const stateObj = { state: '90', attributes: {} };
            expect(entityStateDisplay(officialHass, stateObj, { format: 'duration' })).toBe('1:30');
        });
    });
});

describe('entityStyles', () => {
    it('joins style entries into a css declaration string', () => {
        expect(entityStyles({ styles: { color: 'red', 'font-weight': 'bold' } })).toBe('color: red;font-weight: bold;');
    });

    it('returns an empty string when there are no styles', () => {
        expect(entityStyles({})).toBe('');
        expect(entityStyles(undefined)).toBe('');
    });
});

// See https://github.com/benct/lovelace-multiple-entity-row/issues/325
describe('iconColorCss', () => {
    it('sets all icon-color variables for a configured color', () => {
        expect(iconColorCss('red')).toBe(
            '--paper-item-icon-color: red; --mdc-icon-color: red; --state-icon-color: red;'
        );
    });

    it('returns an empty string when no color is configured', () => {
        expect(iconColorCss(undefined)).toBe('');
    });
});

// See https://github.com/benct/lovelace-multiple-entity-row/issues/197
describe('stateIcon', () => {
    const config = { state_icon: { on: 'mdi:door-open', off: 'mdi:door-closed' } };

    it('returns the mapped icon for the current state', () => {
        expect(stateIcon({ state: 'on' }, config)).toBe('mdi:door-open');
        expect(stateIcon({ state: 'off' }, config)).toBe('mdi:door-closed');
    });

    it('returns undefined for an unmapped state or no state_icon config', () => {
        expect(stateIcon({ state: 'unknown' }, config)).toBeUndefined();
        expect(stateIcon({ state: 'on' }, {})).toBeUndefined();
    });
});
