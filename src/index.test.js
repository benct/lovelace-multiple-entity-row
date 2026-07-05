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

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/227 - top-level
    // hide_if/hide_unavailable were silently ignored on the main entity.
    describe('main-row hiding', () => {
        it('hides the main state slot when top-level hide_if matches', async () => {
            el.setConfig({ entity: 'sensor.main', hide_if: 'off' });
            el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'off', attributes: {} } });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.state.entity')).toBeNull();
        });

        it('shows the main state slot when hide_if does not match', async () => {
            el.setConfig({ entity: 'sensor.main', hide_if: 'off' });
            el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.state.entity')).not.toBeNull();
        });

        it('renders the default value when the main state is hidden', async () => {
            el.setConfig({ entity: 'sensor.main', hide_if: 'off', default: 'n/a' });
            el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'off', attributes: {} } });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.state.entity').textContent).toContain('n/a');
        });
    });

    it('shouldUpdate returns false when neither config nor watched entities changed', () => {
        el.setConfig({ entity: 'sensor.main' });
        const sharedState = { entity_id: 'sensor.main', state: 'on', attributes: {} };
        el.hass = buildHass({ 'sensor.main': sharedState });
        const changedProps = new Map([['_hass', el._hass]]);
        expect(el.shouldUpdate(changedProps)).toBe(false);
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/338 and
    // https://github.com/benct/lovelace-multiple-entity-row/issues/202 - tap/hold/double-tap must
    // be handled per rendered entity, scoped to that entity's own action config, not just the main
    // row's. See https://github.com/benct/lovelace-multiple-entity-row/issues/188 and
    // https://github.com/benct/lovelace-multiple-entity-row/issues/251 - previously, every click
    // anywhere in the row (including on a sub-entity) also bubbled into hui-generic-entity-row's
    // own row-level action handling, which only ever knew about the main entity's config.
    describe('gesture handling', () => {
        let actions;

        beforeEach(() => {
            vi.useFakeTimers();
            actions = [];
            el.addEventListener('hass-action', (ev) => actions.push(ev.detail));
            el.setConfig({
                entity: 'sensor.main',
                tap_action: { action: 'toggle' },
                entities: [{ entity: 'sensor.a', tap_action: { action: 'more-info', entity: 'sensor.a' } }],
            });
            el.hass = buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'sensor.a': { entity_id: 'sensor.a', state: 'off', attributes: {} },
            });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('gives the main entity and a sub-entity independently cached gesture handlers', () => {
            const main = el.getGestureHandlers('main', 'sensor.main', el.config);
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', el.config.entities[0]);
            expect(main).not.toBe(sub);
            // Same key + same render pass returns the same cached handlers, not a fresh set -
            // this is what lets an in-progress hold/double-tap survive an unrelated re-render.
            expect(el.getGestureHandlers('main', 'sensor.main', el.config)).toBe(main);
        });

        it('dispatches using only that entity\'s own action config, not the main row\'s', () => {
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', el.config.entities[0]);
            sub.onDown();
            sub.onUp();
            expect(actions).toEqual([
                {
                    config: { entity: 'sensor.a', tap_action: { action: 'more-info', entity: 'sensor.a' } },
                    action: 'tap',
                },
            ]);
        });

        // Handlers are cached per key until the next setConfig, so these tests reset the config
        // (clearing the cache) rather than passing an ad-hoc config for an already-cached key.
        it('dispatches a hold to hold_action for a sub-entity', () => {
            const subConfig = { entity: 'sensor.a', tap_action: { action: 'toggle' }, hold_action: { action: 'more-info' } };
            el.setConfig({ entity: 'sensor.main', entities: [subConfig] });
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', subConfig);
            sub.onDown();
            vi.advanceTimersByTime(500);
            sub.onUp();
            expect(actions).toEqual([
                { config: { entity: 'sensor.a', hold_action: { action: 'more-info' } }, action: 'hold' },
            ]);
        });

        it('defaults a tap with no tap_action to more-info', () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a' }] });
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', { entity: 'sensor.a' });
            sub.onDown();
            sub.onUp();
            expect(actions).toEqual([
                { config: { entity: 'sensor.a', tap_action: { action: 'more-info' } }, action: 'tap' },
            ]);
        });

        it('does not dispatch when the action is none', () => {
            const subConfig = { entity: 'sensor.a', tap_action: { action: 'none' } };
            el.setConfig({ entity: 'sensor.main', entities: [subConfig] });
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', subConfig);
            sub.onDown();
            sub.onUp();
            expect(actions).toEqual([]);
        });

        it('does not attach gesture handlers for a toggle-mode entity', () => {
            expect(el.getGestureHandlers('sub-0', 'sensor.a', { entity: 'sensor.a', toggle: true })).toBeNull();
        });

        // hui-generic-entity-row binds its own mousedown/click/touchstart/touchend/touchcancel/
        // contextmenu listeners to the whole row regardless of catchInteraction (see #338) - if a
        // sub-entity's click bubbled up to it, it would double-dispatch using the main row's config.
        it('stops native click and mousedown events from bubbling past a sub-entity', async () => {
            await flushRender(el);
            const bubbled = vi.fn();
            el.shadowRoot.addEventListener('click', bubbled);
            el.shadowRoot.addEventListener('mousedown', bubbled);
            const subDiv = el.shadowRoot.querySelector('.entity:not(.state)');
            subDiv.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
            subDiv.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            expect(bubbled).not.toHaveBeenCalled();
        });
    });
});
