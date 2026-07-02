import { describe, expect, it } from 'vitest';
import {
    getEntityIds,
    hasConfigOrEntitiesChanged,
    hasGenericSecondaryInfo,
    hideIf,
    hideUnavailable,
    isObject,
    isUnavailable,
} from './util';

describe('isObject', () => {
    it('is true for plain objects', () => {
        expect(isObject({})).toBe(true);
    });

    it('is false for arrays, null and non-objects', () => {
        expect(isObject([])).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject('foo')).toBe(false);
    });
});

describe('isUnavailable', () => {
    it('is true when there is no state object', () => {
        expect(isUnavailable(undefined)).toBe(true);
    });

    it('is true for unavailable/unknown states', () => {
        expect(isUnavailable({ state: 'unavailable' })).toBe(true);
        expect(isUnavailable({ state: 'unknown' })).toBe(true);
    });

    it('is false for a normal state', () => {
        expect(isUnavailable({ state: 'on' })).toBe(false);
    });
});

describe('hideUnavailable', () => {
    it('is falsy when hide_unavailable is not set', () => {
        expect(hideUnavailable({ state: 'unavailable' }, {})).toBeFalsy();
    });

    it('is true when hide_unavailable is set and the entity is unavailable', () => {
        expect(hideUnavailable({ state: 'unavailable' }, { hide_unavailable: true })).toBe(true);
    });

    it('is true when the configured attribute is missing', () => {
        const stateObj = { state: 'on', attributes: {} };
        expect(hideUnavailable(stateObj, { hide_unavailable: true, attribute: 'brightness' })).toBe(true);
    });

    it('is false when the configured attribute is present', () => {
        const stateObj = { state: 'on', attributes: { brightness: 100 } };
        expect(hideUnavailable(stateObj, { hide_unavailable: true, attribute: 'brightness' })).toBe(false);
    });
});

describe('hideIf', () => {
    it('is false when hide_if is not configured', () => {
        expect(hideIf({ state: 'on' }, {})).toBe(false);
    });

    it('matches a simple string/number value', () => {
        expect(hideIf({ state: 'off' }, { hide_if: 'off' })).toBe(true);
        expect(hideIf({ state: 'on' }, { hide_if: 'off' })).toBe(false);
    });

    it('matches numeric values coerced from string state', () => {
        expect(hideIf({ state: '5' }, { hide_if: 5 })).toBe(true);
    });

    it('matches any value in a list', () => {
        expect(hideIf({ state: 'idle' }, { hide_if: ['off', 'idle'] })).toBe(true);
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/227 -
    // hide_if must also work against an attribute value, not just the main state.
    it('checks against the configured attribute value', () => {
        const stateObj = { state: 'on', attributes: { battery_level: 5 } };
        expect(hideIf(stateObj, { attribute: 'battery_level', hide_if: { below: 10 } })).toBe(true);
        expect(hideIf(stateObj, { attribute: 'battery_level', hide_if: { above: 10 } })).toBe(false);
    });

    it('supports below/above thresholds', () => {
        expect(hideIf({ state: '5' }, { hide_if: { below: 10 } })).toBe(true);
        expect(hideIf({ state: '15' }, { hide_if: { above: 10 } })).toBe(true);
        expect(hideIf({ state: '10' }, { hide_if: { below: 10, above: 10 } })).toBe(false);
    });
});

describe('hasGenericSecondaryInfo', () => {
    it('is true for a recognized secondary info string', () => {
        expect(hasGenericSecondaryInfo('last-changed')).toBe(true);
    });

    it('is false for an unrecognized value or non-string config', () => {
        expect(hasGenericSecondaryInfo('not-a-real-option')).toBe(false);
        expect(hasGenericSecondaryInfo({ entity: 'sensor.foo' })).toBe(false);
    });
});

describe('getEntityIds', () => {
    it('collects the main entity, secondary info entity and entities list', () => {
        const config = {
            entity: 'sensor.main',
            secondary_info: { entity: 'sensor.secondary' },
            entities: ['sensor.a', { entity: 'sensor.b' }],
        };
        expect(getEntityIds(config)).toEqual(['sensor.main', 'sensor.secondary', 'sensor.a', 'sensor.b']);
    });

    it('filters out missing entries', () => {
        expect(getEntityIds({ entities: [] })).toEqual([]);
    });
});

describe('hasConfigOrEntitiesChanged', () => {
    it('is true when config changed', () => {
        const changedProps = new Map([['config', {}]]);
        expect(hasConfigOrEntitiesChanged({}, changedProps)).toBe(true);
    });

    it('is false when there is no previous hass to compare', () => {
        const changedProps = new Map();
        expect(hasConfigOrEntitiesChanged({}, changedProps)).toBe(false);
    });

    it('is true when a watched entity state reference changed', () => {
        const oldHass = { states: { 'sensor.a': { state: 'on' } } };
        const node = { entityIds: ['sensor.a'], _hass: { states: { 'sensor.a': { state: 'off' } } } };
        const changedProps = new Map([['_hass', oldHass]]);
        expect(hasConfigOrEntitiesChanged(node, changedProps)).toBe(true);
    });

    it('is false when watched entity states are unchanged', () => {
        const sharedState = { state: 'on' };
        const oldHass = { states: { 'sensor.a': sharedState } };
        const node = { entityIds: ['sensor.a'], _hass: { states: { 'sensor.a': sharedState } } };
        const changedProps = new Map([['_hass', oldHass]]);
        expect(hasConfigOrEntitiesChanged(node, changedProps)).toBe(false);
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/370 and
    // https://github.com/benct/lovelace-multiple-entity-row/issues/371 - HA 2026.2+ installs stub
    // formatEntityName/formatEntityState/formatEntityAttributeValue functions on initial connection
    // (returning raw, unformatted values) and swaps in the real implementations asynchronously once
    // translations load. Without detecting that swap, a row can get stuck showing stale/raw output
    // (e.g. a `name` override reverting, or a numeric state showing unformatted) until some
    // unrelated entity state change happens to force a re-render.
    it.each(['formatEntityName', 'formatEntityState', 'formatEntityAttributeValue'])(
        'is true when hass swaps in a new %s implementation',
        (key) => {
            const sharedState = { state: 'on' };
            const oldHass = { states: { 'sensor.a': sharedState }, [key]: () => 'stub' };
            const node = {
                entityIds: ['sensor.a'],
                _hass: { states: { 'sensor.a': sharedState }, [key]: () => 'real' },
            };
            const changedProps = new Map([['_hass', oldHass]]);
            expect(hasConfigOrEntitiesChanged(node, changedProps)).toBe(true);
        }
    );
});
