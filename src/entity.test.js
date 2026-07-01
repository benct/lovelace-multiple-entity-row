import { describe, expect, it, vi } from 'vitest';
import { checkEntity, computeEntity, entityName, entityStateDisplay, entityStyles } from './entity';
import { NumberFormat } from './lib/constants';

const hass = {
    localize: vi.fn((key) => `localized:${key}`),
    locale: { number_format: NumberFormat.comma_decimal, language: 'en-US' },
    entities: {},
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
    it('localizes unavailable states', () => {
        const stateObj = { state: 'unavailable', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, {})).toBe('localized:state.default.unavailable');
    });

    it('reads and formats an attribute value with a unit', () => {
        const stateObj = { state: 'on', attributes: { battery_level: 42 } };
        expect(entityStateDisplay(hass, stateObj, { attribute: 'battery_level', unit: '%' })).toBe('42 %');
    });

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

    it('applies the invert format', () => {
        const stateObj = { state: '5', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'invert' })).toBe('-5');
    });

    it('applies the position format', () => {
        const stateObj = { state: '30', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'position' })).toBe('70');
    });

    it('leaves non-numeric values untouched when a format is configured', () => {
        const stateObj = { state: 'not-a-number', attributes: {} };
        expect(entityStateDisplay(hass, stateObj, { format: 'precision2' })).toBe('not-a-number');
    });

    it('falls back to computeStateDisplay for the main state with no attribute or format', () => {
        const stateObj = { entity_id: 'sensor.temp', state: '21', attributes: { unit_of_measurement: '°C' } };
        expect(entityStateDisplay(hass, stateObj, {})).toBe('21 °C');
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
