// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './index';

const flushRender = async (el) => {
    await el.updateComplete;
    await el.updateComplete;
};

const buildHass = (states = {}) => ({
    states,
    entities: {},
    locale: { number_format: 'comma_decimal', language: 'en-US' },
    localize: vi.fn((key) => `localized:${key}`),
});

describe('multiple-entity-row', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('multiple-entity-row');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
    });

    it('throws when configured without a main entity', () => {
        expect(() => el.setConfig({})).toThrow('Please define a main entity.');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/364 -
    // an invalid entities/secondary_info config should fail fast at setConfig time.
    it('throws when an entities item is invalid', () => {
        expect(() => el.setConfig({ entity: 'sensor.main', entities: [{ name: 'no entity/attribute/icon' }] })).toThrow(
            /requires at least one/
        );
    });

    it('tracks entity ids from the main entity, entities list and secondary_info', () => {
        el.setConfig({
            entity: 'sensor.main',
            entities: ['sensor.a', { entity: 'sensor.b' }],
            secondary_info: { entity: 'sensor.c' },
        });
        expect(el.entityIds).toEqual(['sensor.main', 'sensor.c', 'sensor.a', 'sensor.b']);
    });

    it('normalizes name: false to a single space so the row header collapses', () => {
        el.setConfig({ entity: 'sensor.main', name: false });
        expect(el.config.name).toBe(' ');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/386 - HA 2026.7+'s
    // entities-card row editor silently renames a custom row's `format` key to `time_format` on
    // save. Fall back to `time_format` when `format` itself isn't set, so a row edited through
    // HA's own UI editor keeps working.
    it('falls back to time_format when format was migrated away by HA', () => {
        el.setConfig({ entity: 'sensor.main', time_format: 'precision2' });
        expect(el.config.format).toBe('precision2');
    });

    it('prefers format over time_format if both are somehow present', () => {
        el.setConfig({ entity: 'sensor.main', format: 'precision1', time_format: 'precision2' });
        expect(el.config.format).toBe('precision1');
    });

    it('renders no row content before hass and config are both set', async () => {
        await flushRender(el);
        expect(el.shadowRoot.innerHTML).not.toContain('hui-generic-entity-row');
        expect(el.shadowRoot.innerHTML).not.toContain('hui-warning');
    });

    it('renders a warning when the configured entity is missing from hass.states', async () => {
        el.setConfig({ entity: 'sensor.missing' });
        el.hass = buildHass({});
        await flushRender(el);
        expect(el.shadowRoot.innerHTML).toContain('hui-warning');
    });

    it('renders the entity row once hass has the configured entity state', async () => {
        el.setConfig({ entity: 'sensor.main' });
        el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });
        await flushRender(el);
        expect(el.shadowRoot.innerHTML).toContain('hui-generic-entity-row');
    });

    it('populates per-row entities with their own state objects', async () => {
        el.setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
        el.hass = buildHass({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: 'off', attributes: {} },
        });
        expect(el.entities).toHaveLength(1);
        expect(el.entities[0].stateObj.entity_id).toBe('sensor.a');
    });

    it('shouldUpdate returns false when neither config nor watched entities changed', () => {
        el.setConfig({ entity: 'sensor.main' });
        const sharedState = { entity_id: 'sensor.main', state: 'on', attributes: {} };
        el.hass = buildHass({ 'sensor.main': sharedState });
        const changedProps = new Map([['_hass', el._hass]]);
        expect(el.shouldUpdate(changedProps)).toBe(false);
    });
});
