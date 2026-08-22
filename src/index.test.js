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
    formatEntityState: vi.fn((stateObj) => stateObj.state),
    formatEntityAttributeValue: vi.fn((stateObj, attribute) => `${stateObj.attributes[attribute] ?? ''}`),
    callService: vi.fn(),
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

    // A malformed entry still fails fast at setConfig time. Distinct from #364, which is about an
    // entity id that is well-formed but resolves to nothing at runtime.
    it('throws when an entities item is invalid', () => {
        expect(() => el.setConfig({ entity: 'sensor.main', entities: [42] })).toThrow(
            /valid entity ID string or entity object/
        );
        expect(() => el.setConfig({ entity: 'sensor.main', entities: [''] })).toThrow(/must not be blank/);
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/340 - repeating the main
    // entity's state without naming it again, which is the only way under auto-entities.
    it('renders the main entity state for an entry with no entity of its own', async () => {
        el.setConfig({ entity: 'sensor.main', entities: [{}, { name: 'Copy' }] });
        el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: '21', attributes: {} } });
        await flushRender(el);
        const values = [...el.shadowRoot.querySelectorAll('.entity:not(.state) div')].map((d) => d.textContent.trim());
        expect(values).toEqual(['21', '21']);
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

    // setConfig and the first hass assignment can land in separate update batches (found via
    // #400, likely behind the intermittent blank rows in #389): the config-only update renders
    // empty, and the first-hass update must then actually paint the row rather than being
    // swallowed by the shouldUpdate gate.
    it('renders when hass arrives in a later update batch than setConfig', async () => {
        el.setConfig({ entity: 'sensor.main' });
        await flushRender(el); // config-only update completes first - renders empty
        el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });
        await flushRender(el);
        expect(el.shadowRoot.innerHTML).toContain('hui-generic-entity-row');
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

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/221 and #305 - a timestamp
    // format on the last-changed/last-updated pseudo-attributes was silently ignored in favor of
    // the relative-time widget.
    describe('last-changed formatting', () => {
        const hassWith = (extra = {}) =>
            buildHass({
                'sensor.main': {
                    entity_id: 'sensor.main',
                    state: 'on',
                    attributes: {},
                    last_changed: '2026-07-17T14:30:00+00:00',
                    ...extra,
                },
            });

        it('renders relative time by default for attribute last-changed', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.main', attribute: 'last-changed' }] });
            el.hass = hassWith();
            await flushRender(el);
            expect(el.shadowRoot.innerHTML).toContain('ha-relative-time');
        });

        it('honors a timestamp format on attribute last-changed', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.main', attribute: 'last-changed', format: 'time' }],
            });
            el.hass = hassWith();
            await flushRender(el);
            expect(el.shadowRoot.innerHTML).toContain('hui-timestamp-display');
            expect(el.shadowRoot.innerHTML).not.toContain('ha-relative-time');
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/302 - the default-value
    // branch must resolve the header like a visible entity, not require an explicit name.
    it('falls back to the friendly name for a hidden entity showing its default', async () => {
        el.setConfig({
            entity: 'sensor.main',
            entities: [{ entity: 'sensor.a', hide_if: 'off', default: 'n/a' }],
        });
        el.hass = buildHass({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: 'off', attributes: { friendly_name: 'Alpha' } },
        });
        await flushRender(el);
        expect(el.shadowRoot.innerHTML).toContain('Alpha');
        expect(el.shadowRoot.innerHTML).toContain('n/a');
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/341 and #365 - blanking
    // the name left HA's name box in place taking its flex share; hideName removes the box so
    // the entities get that width.
    describe('hidden name', () => {
        const hassWithMain = () =>
            buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });
        const rowFor = async (config) => {
            el.setConfig({ entity: 'sensor.main', ...config });
            el.hass = hassWithMain();
            await flushRender(el);
            return el.shadowRoot.querySelector('hui-generic-entity-row');
        };

        it('hides the name box for name: false', async () => {
            expect((await rowFor({ name: false })).hideName).toBe(true);
        });

        it('keeps the name box for a normal name', async () => {
            expect((await rowFor({ name: 'Kitchen' })).hideName).toBe(false);
        });

        // The name box is also what pushes the entities right (it grows at flex: 1 1 30%), so
        // removing it has to hand that job over or they end up against the icon.
        it('keeps the entities right-aligned once the name box is gone', async () => {
            await rowFor({ name: false });
            expect(el.shadowRoot.querySelector('.entities-row').classList.contains('no-name')).toBe(true);
        });

        it('adds no such class while the name box remains', async () => {
            await rowFor({ name: 'Kitchen' });
            expect(el.shadowRoot.querySelector('.entities-row').classList.contains('no-name')).toBe(false);
        });

        // HA renders secondary info inside the same box, so hiding it would silently take the
        // secondary text with it.
        it('keeps the name box when secondary info would be lost', async () => {
            expect((await rowFor({ name: false, secondary_info: 'last-changed' })).hideName).toBe(false);
            expect((await rowFor({ name: false, secondary_info: { entity: 'sensor.main' } })).hideName).toBe(false);
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/261 - entity slots are
    // flex items, so vertical alignment has to be set on their container.
    describe('align', () => {
        const containerFor = async (config) => {
            el.setConfig({ entity: 'sensor.main', entities: ['sensor.main'], ...config });
            el.hass = buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });
            await flushRender(el);
            return el.shadowRoot.querySelector('.entities-row, .entities-column');
        };

        it('adds no class by default', async () => {
            const row = await containerFor({});
            expect(row.classList.contains('align-top')).toBe(false);
            expect(row.classList.contains('align-bottom')).toBe(false);
        });

        it('aligns top and bottom', async () => {
            expect((await containerFor({ align: 'top' })).classList.contains('align-top')).toBe(true);
            expect((await containerFor({ align: 'bottom' })).classList.contains('align-bottom')).toBe(true);
        });

        it('ignores an unknown value rather than emitting a stray class', async () => {
            const row = await containerFor({ align: 'sideways' });
            expect(row.className).toBe('entities-row');
        });

        it('applies to a column layout too', async () => {
            const row = await containerFor({ column: true, align: 'bottom' });
            expect(row.classList.contains('entities-column')).toBe(true);
            expect(row.classList.contains('align-bottom')).toBe(true);
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/65, #299 and #350 - a
    // timer's raw state is only active/idle/paused, so the countdown is shown instead.
    describe('timer entities', () => {
        const timerHass = (state, attributes) =>
            buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'timer.kitchen': { entity_id: 'timer.kitchen', state, attributes },
            });

        it('renders the countdown instead of the raw state', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'timer.kitchen' }] });
            el.hass = timerHass('paused', { remaining: '00:01:30' });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('multiple-entity-row-timer')).not.toBeNull();
            expect(el.shadowRoot.innerHTML).not.toContain('paused<');
        });

        it('works for the main state too', async () => {
            el.setConfig({ entity: 'timer.kitchen' });
            el.hass = timerHass('paused', { remaining: '00:01:30' });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entity.state multiple-entity-row-timer')).not.toBeNull();
        });

        // An explicit attribute or template is a deliberate choice and must not be overridden.
        it('leaves an explicit attribute alone', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'timer.kitchen', attribute: 'duration' }] });
            el.hass = timerHass('active', { remaining: '00:01:30', duration: '00:05:00' });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('multiple-entity-row-timer')).toBeNull();
        });

        it('leaves a non-timer entity alone', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.main' }] });
            el.hass = timerHass('idle', {});
            await flushRender(el);
            expect(el.shadowRoot.querySelector('multiple-entity-row-timer')).toBeNull();
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/364 - a removed or renamed
    // entity id used to vanish from the row with no clue which slot it was.
    describe('missing entity', () => {
        const hassWithoutB = () =>
            buildHass({ 'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} } });

        it('marks a missing entity instead of dropping the slot', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.gone', name: 'Gone' }] });
            el.hass = hassWithoutB();
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entity .missing')).not.toBeNull();
            expect(el.shadowRoot.innerHTML).toContain('Gone');
        });

        // hide_unavailable is documented as hiding an entity that is unavailable OR absent.
        it('still hides a missing entity with hide_unavailable', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.gone', hide_unavailable: true }],
            });
            el.hass = hassWithoutB();
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entity .missing')).toBeNull();
            expect(el.shadowRoot.querySelectorAll('.entity:not(.state)')).toHaveLength(0);
        });

        it('prefers a configured default over the marker', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.gone', default: 'n/a' }] });
            el.hass = hassWithoutB();
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entity .missing')).toBeNull();
            expect(el.shadowRoot.innerHTML).toContain('n/a');
        });

        // An entity that exists but is merely unavailable is a normal state, not a missing id.
        it('does not mark an entity that exists but is unavailable', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a' }] });
            el.hass = buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'sensor.a': { entity_id: 'sensor.a', state: 'unavailable', attributes: {} },
            });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entity .missing')).toBeNull();
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/265 - a confirmation on
    // tap_action must gate the toggle instead of being bypassed by ha-entity-toggle.
    describe('toggle confirmation', () => {
        const toggleConfig = (tap_action) => ({
            entity: 'sensor.main',
            entities: [{ entity: 'switch.a', toggle: true, tap_action }],
        });
        const toggleHass = () =>
            buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'switch.a': { entity_id: 'switch.a', state: 'off', attributes: {} },
            });

        it('toggles via HA only after the user confirms', async () => {
            vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
            el.setConfig(toggleConfig({ action: 'toggle', confirmation: { text: 'Sure?' } }));
            el.hass = toggleHass();
            await flushRender(el);
            el.shadowRoot.querySelector('ha-entity-toggle').parentElement.click();
            expect(confirm).toHaveBeenCalledWith('Sure?');
            expect(el._hass.callService).toHaveBeenCalledWith('homeassistant', 'toggle', { entity_id: 'switch.a' });
            vi.unstubAllGlobals();
        });

        it('does not toggle when the user cancels', async () => {
            vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
            el.setConfig(toggleConfig({ action: 'toggle', confirmation: true }));
            el.hass = toggleHass();
            await flushRender(el);
            el.shadowRoot.querySelector('ha-entity-toggle').parentElement.click();
            expect(confirm).toHaveBeenCalled();
            expect(el._hass.callService).not.toHaveBeenCalled();
            vi.unstubAllGlobals();
        });

        // The toggle is always wrapped now (the wrapper stops pointer events reaching our gesture
        // handlers, see #415), so what matters here is that without a confirmation the wrapper
        // stays out of the way and lets ha-entity-toggle handle the tap itself.
        it('does not intercept the toggle when no confirmation is configured', async () => {
            vi.stubGlobal('confirm', vi.fn());
            el.setConfig(toggleConfig({ action: 'toggle' }));
            el.hass = toggleHass();
            await flushRender(el);
            el.shadowRoot.querySelector('ha-entity-toggle').parentElement.click();
            expect(confirm).not.toHaveBeenCalled();
            expect(el._hass.callService).not.toHaveBeenCalled();
            vi.unstubAllGlobals();
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/281 - a name:false entity
    // (and the header-less main state) reserves the header line so values align with headered
    // siblings; an all-headerless row stays compact with no reserved line.
    describe('header placeholder', () => {
        const twoEntityHass = () =>
            buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'sensor.a': { entity_id: 'sensor.a', state: '1', attributes: { friendly_name: 'Alpha' } },
                'sensor.b': { entity_id: 'sensor.b', state: '2', attributes: {} },
            });

        it('reserves the header line for name:false when a sibling has a header', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.a' }, { entity: 'sensor.b', name: false }],
            });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(true);
        });

        it('inserts no placeholder when nothing renders a header', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [
                    { entity: 'sensor.a', name: false },
                    { entity: 'sensor.b', name: false },
                ],
            });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(false);
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/418 and #421 -
        // `name: ' '` means "no header here" and must behave exactly like name:false. #418 first
        // rendered it as an nbsp, which kept blank-named entities level with each other but made
        // an all-blank row reserve a line nothing needed, pushing its values below the row name.
        it('treats a whitespace-only name like name:false', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', name: ' ' }] });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(false);
            expect(spans.some((span) => span.textContent === ' ')).toBe(false);
        });

        // ...but a blank name still needs the placeholder when a sibling does render a header,
        // which is the alignment #281 was about.
        it('reserves the header line for a blank name beside a headered sibling', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.a' }, { entity: 'sensor.b', name: ' ' }],
            });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(true);
            expect(spans.some((span) => span.textContent === ' ')).toBe(false);
        });

        it('does not count a whitespace-only state_header as a header', async () => {
            el.setConfig({
                entity: 'sensor.main',
                state_header: ' ',
                entities: [{ entity: 'sensor.a', name: false }],
            });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(false);
            expect(spans.some((span) => span.textContent === ' ')).toBe(false);
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/425 - the reserved line
        // aligns text baselines, so a slot rendering a control (icon or toggle) should not get one:
        // it only makes the row taller. Text renderers, including hui-timestamp-display and
        // ha-relative-time, must keep reserving.
        describe('non-text values', () => {
            const withSibling = (entity) => ({
                entity: 'sensor.main',
                show_state: false,
                entities: [{ entity: 'sensor.a' }, entity],
            });
            const nbspCount = () =>
                [...el.shadowRoot.querySelectorAll('.entity span')].filter((s) => s.textContent === '\u00a0').length;

            it('reserves no line for a blank-named icon entity', async () => {
                el.setConfig(withSibling({ entity: 'sensor.b', name: false, icon: true }));
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(0);
            });

            it('reserves no line for a blank-named state_icon entity', async () => {
                el.setConfig(withSibling({ entity: 'sensor.b', name: false, state_icon: { 2: 'mdi:check' } }));
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(0);
            });

            it('reserves no line for a blank-named toggle entity', async () => {
                el.setConfig(withSibling({ entity: 'sensor.b', name: false, toggle: true }));
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(0);
            });

            it('still reserves a line for a blank-named text entity', async () => {
                el.setConfig(withSibling({ entity: 'sensor.b', name: false }));
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(1);
            });

            // The icon box shrinks to the icon's natural height, but a picture-bearing entity
            // needs the fixed box back: state-badge hides the icon and paints the picture as a
            // background, so there is no in-flow content to give the host height.
            it('marks a picture entity so its badge keeps a fixed box', async () => {
                el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.pic', icon: true }] });
                el.hass = buildHass({
                    'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                    'sensor.pic': {
                        entity_id: 'sensor.pic',
                        state: 'on',
                        attributes: { entity_picture: '/api/image/serve/abc' },
                    },
                });
                await flushRender(el);
                expect(el.shadowRoot.querySelector('state-badge').classList.contains('has-picture')).toBe(true);
            });

            it('does not mark a plain icon entity', async () => {
                el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', icon: 'mdi:flash' }] });
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(el.shadowRoot.querySelector('state-badge').classList.contains('has-picture')).toBe(false);
            });

            // An explicit icon wins over the picture in state-badge, so the box should shrink.
            it('does not mark a picture entity whose icon is overridden', async () => {
                el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.pic', icon: 'mdi:flash' }] });
                el.hass = buildHass({
                    'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                    'sensor.pic': {
                        entity_id: 'sensor.pic',
                        state: 'on',
                        attributes: { entity_picture: '/api/image/serve/abc' },
                    },
                });
                await flushRender(el);
                expect(el.shadowRoot.querySelector('state-badge').classList.contains('has-picture')).toBe(false);
            });

            it('still renders a real name on a control entity', async () => {
                el.setConfig(withSibling({ entity: 'sensor.b', name: 'Fan', icon: true }));
                el.hass = twoEntityHass();
                await flushRender(el);
                const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
                expect(spans.some((s) => s.textContent === 'Fan')).toBe(true);
            });

            it('reserves no line for a toggle main state', async () => {
                el.setConfig({ entity: 'sensor.main', toggle: true, entities: [{ entity: 'sensor.a' }] });
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(0);
            });

            it('still reserves a line for a text main state', async () => {
                el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a' }] });
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(1);
            });

            // A row-level `icon:` is the row's own icon, drawn by hui-generic-entity-row - it says
            // nothing about what the main STATE slot renders, so it must not suppress the line.
            it('still reserves a line for a text main state on a row with an icon', async () => {
                el.setConfig({ entity: 'sensor.main', icon: 'mdi:flash', entities: [{ entity: 'sensor.a' }] });
                el.hass = twoEntityHass();
                await flushRender(el);
                expect(nbspCount()).toBe(1);
            });
        });

        // The default-value branch renders its own header span (see #302).
        it('treats a whitespace-only name like name:false on a hidden entity', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.a', name: ' ', hide_if: '1', default: 'n/a' }],
            });
            el.hass = twoEntityHass();
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === '\u00a0')).toBe(false);
            expect(spans.some((span) => span.textContent === ' ')).toBe(false);
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/384
    it('renders the main state before sub-entities with show_state_first', async () => {
        el.setConfig({ entity: 'sensor.main', show_state_first: true, entities: ['sensor.a'] });
        el.hass = buildHass({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: 'off', attributes: {} },
        });
        await flushRender(el);
        const entities = [...el.shadowRoot.querySelectorAll('.entity')];
        expect(entities).toHaveLength(2);
        expect(entities[0].classList.contains('state')).toBe(true);
    });

    it('renders the main state last by default', async () => {
        el.setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
        el.hass = buildHass({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: 'off', attributes: {} },
        });
        await flushRender(el);
        const entities = [...el.shadowRoot.querySelectorAll('.entity')];
        expect(entities).toHaveLength(2);
        expect(entities[entities.length - 1].classList.contains('state')).toBe(true);
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

        it("dispatches using only that entity's own action config, not the main row's", () => {
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
            const subConfig = {
                entity: 'sensor.a',
                tap_action: { action: 'toggle' },
                hold_action: { action: 'more-info' },
            };
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

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/415 - a toggle entity
        // still owns its header/name area, so it needs gesture handlers like any other entity.
        // Skipping them (4.7.0-4.8.0-beta.2) left everything except the switch dead to clicks.
        it('attaches gesture handlers for a toggle-mode entity', () => {
            const subConfig = { entity: 'sensor.a', toggle: true, tap_action: { action: 'more-info' } };
            el.setConfig({ entity: 'sensor.main', entities: [subConfig] });
            const sub = el.getGestureHandlers('sub-0', 'sensor.a', subConfig);
            expect(sub).not.toBeNull();
            sub.onDown();
            sub.onUp();
            expect(actions).toEqual([
                { config: { entity: 'sensor.a', tap_action: { action: 'more-info' } }, action: 'tap' },
            ]);
        });

        // ha-entity-toggle stops click but not the pointer family, so without stopping pointer
        // events at the switch a tap there would both toggle and dispatch the tap action.
        it('does not dispatch when the pointer interaction happens on the toggle itself', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', toggle: true }] });
            el.hass = buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
                'sensor.a': { entity_id: 'sensor.a', state: 'on', attributes: {} },
            });
            await flushRender(el);
            const toggleWrapper = el.shadowRoot.querySelector('.entity:not(.state) ha-entity-toggle').parentElement;
            toggleWrapper.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
            toggleWrapper.dispatchEvent(new Event('pointerup', { bubbles: true, composed: true }));
            expect(actions).toEqual([]);
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

    // 4.8.0 templating: supported config strings containing {{ }} render server-side via a
    // render_template websocket subscription (see #409 and the module comment in templates.ts).
    describe('templating', () => {
        let connection;

        const buildConnection = () => {
            const subs = [];
            return {
                subs,
                subscribeMessage: vi.fn((callback, message) => {
                    const sub = { callback, message, unsub: vi.fn(() => Promise.resolve()) };
                    subs.push(sub);
                    return Promise.resolve(sub.unsub);
                }),
            };
        };

        const hassWith = (states) => ({ ...buildHass(states), connection });

        const states = () => ({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: '7', attributes: {} },
        });

        beforeEach(() => {
            connection = buildConnection();
        });

        it('subscribes for templated fields and re-renders when a result is pushed', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', name: '{{ x }}' }] });
            el.hass = hassWith(states());
            await flushRender(el);
            expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
            expect(connection.subs[0].message).toEqual({
                type: 'render_template',
                template: '{{ x }}',
                variables: { entity: 'sensor.a' },
                report_errors: true,
            });
            // Pending renders blank - never the raw Jinja source.
            expect(el.shadowRoot.innerHTML).not.toContain('{{');

            connection.subs[0].callback({ result: 'Wind' });
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === 'Wind')).toBe(true);
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/422 - the whole point
        // of inlining vars is that a field stays a single subscription; this is the end-to-end
        // proof that the prefix survives the round trip through the element.
        it('inlines vars into a field template and renders the result', async () => {
            el.setConfig({
                entity: 'sensor.main',
                vars: { host: "{{ state_attr(entity, 'host') }}" },
                entities: [{ entity: 'sensor.a', vars: { act: 'restart' }, name: '{{ act }} on {{ host }}' }],
            });
            el.hass = hassWith(states());
            await flushRender(el);
            expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
            expect(connection.subs[0].message.template).toBe(
                '{% set host = state_attr(entity, \'host\') %}{% set act = "restart" %}{{ act }} on {{ host }}'
            );
            connection.subs[0].callback({ result: 'restart on nas' });
            await flushRender(el);
            const spans = [...el.shadowRoot.querySelectorAll('.entity span')];
            expect(spans.some((span) => span.textContent === 'restart on nas')).toBe(true);
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/439
        it('renders a templated styles value once its result lands', async () => {
            el.setConfig({
                entity: 'sensor.main',
                styles: { color: "{{ 'red' if is_state(entity, 'on') else 'green' }}", 'font-weight': 'bold' },
            });
            el.hass = hassWith(states());
            await flushRender(el);
            const state = () => el.shadowRoot.querySelector('.state.entity').getAttribute('style');
            // Pending: the other declarations apply, the templated one is absent.
            expect(state()).toBe('font-weight: bold;');
            connection.subs[0].callback({ result: 'red' });
            await flushRender(el);
            expect(state()).toBe('color: red;font-weight: bold;');
        });

        // Gesture handlers are cached until the next setConfig, so an action config resolved at
        // render time would be frozen at whatever the first render saw - including a pending
        // result. Resolving at dispatch also means the service call carries current values.
        it('resolves an action template when the action fires, not at first render', async () => {
            const actions = [];
            el.addEventListener('hass-action', (ev) => actions.push(ev.detail));
            el.setConfig({
                entity: 'sensor.main',
                vars: { host: 'nas' },
                entities: [
                    {
                        entity: 'sensor.a',
                        tap_action: {
                            action: 'call-service',
                            service: 'button.press',
                            service_data: { entity_id: "{{ 'button.' ~ host }}" },
                        },
                    },
                ],
            });
            el.hass = hassWith(states());
            await flushRender(el);

            // fire once while the result is still pending
            const gesture = el.getGestureHandlers('sub-0', 'sensor.a', el.config.entities[0]);
            gesture.onDown();
            gesture.onUp();
            expect(actions[0].config.tap_action.service_data.entity_id).toBe('');

            // the result lands; the SAME cached handler must now dispatch the resolved value
            connection.subs[0].callback({ result: 'button.nas' });
            await flushRender(el);
            gesture.onDown();
            gesture.onUp();
            expect(actions[1].config.tap_action.service_data.entity_id).toBe('button.nas');
        });

        it('hides and unhides an entity as its hide_if template verdict changes', async () => {
            el.setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', hide_if: '{{ hide }}' }] });
            el.hass = hassWith(states());
            await flushRender(el);
            // Pending verdict renders visible.
            expect(el.shadowRoot.querySelectorAll('.entity:not(.state)')).toHaveLength(1);

            connection.subs[0].callback({ result: true });
            await flushRender(el);
            expect(el.shadowRoot.querySelectorAll('.entity:not(.state)')).toHaveLength(0);

            connection.subs[0].callback({ result: false });
            await flushRender(el);
            expect(el.shadowRoot.querySelectorAll('.entity:not(.state)')).toHaveLength(1);
        });

        it('renders a value template result verbatim with the configured unit', async () => {
            el.setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.a', name: 'A', template: '{{ v }}', unit: 'km' }],
            });
            el.hass = hassWith(states());
            connection.subs[0].callback({ result: 12.5 });
            await flushRender(el);
            const value = el.shadowRoot.querySelector('.entity:not(.state) div');
            expect(value.textContent.trim()).toBe('12.5 km');
        });

        it('resolves a templated main name into the generic row config', async () => {
            el.setConfig({ entity: 'sensor.main', name: '{{ n }}' });
            el.hass = hassWith(states());
            connection.subs[0].callback({ result: 'Row Name' });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('hui-generic-entity-row').config.name).toBe('Row Name');
        });

        it('renders a templated secondary_info string', async () => {
            el.setConfig({ entity: 'sensor.main', secondary_info: '{{ s }}' });
            el.hass = hassWith(states());
            connection.subs[0].callback({ result: '5 min left' });
            await flushRender(el);
            const row = el.shadowRoot.querySelector('hui-generic-entity-row');
            expect(row.secondaryText.values).toContain('5 min left');
        });

        it('applies secondary_info styles, templated or not', async () => {
            el.setConfig({
                entity: 'sensor.main',
                secondary_info: { entity: 'sensor.a', styles: { color: '{{ c }}', 'font-weight': 'bold' } },
            });
            el.hass = hassWith(states());
            connection.subs[0].callback({ result: 'red' });
            await flushRender(el);
            const row = el.shadowRoot.querySelector('hui-generic-entity-row');
            expect(row.secondaryText.values).toContain('color: red;font-weight: bold;');
        });

        it('unsubscribes when the element is disconnected', async () => {
            el.setConfig({ entity: 'sensor.main', name: '{{ n }}' });
            el.hass = hassWith(states());
            await flushRender(el);
            el.remove();
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(connection.subs[0].unsub).toHaveBeenCalled();
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/416 - the resolution rules
    // themselves are covered in color.test.ts; these pin how the result reaches HA's elements.
    describe('icon color', () => {
        const states = () => ({
            'sensor.main': { entity_id: 'sensor.main', state: 'on', attributes: {} },
            'sensor.a': { entity_id: 'sensor.a', state: 'on', attributes: { icon: 'mdi:foo' } },
        });
        const rowConfig = async (config) => {
            el.setConfig({ entity: 'sensor.main', ...config });
            el.hass = buildHass(states());
            await flushRender(el);
            return el.shadowRoot.querySelector('hui-generic-entity-row').config;
        };

        it('colors the main row by state by default', async () => {
            expect(await rowConfig({})).toMatchObject({ state_color: true });
        });

        it('passes color: none through as state_color false', async () => {
            expect(await rowConfig({ color: 'none' })).toMatchObject({ state_color: false });
        });

        // A theme name must arrive as a CSS variable, and must NOT travel as state_color - the
        // literal string "state" would be invalid CSS on pre-2026.8 state-badges.
        it('passes a theme color as a computed CSS color', async () => {
            const config = await rowConfig({ color: 'red' });
            expect(config.color).toBe('var(--red-color)');
            expect(config.state_color).toBeUndefined();
        });

        it('keeps icon_color working by not defaulting to state coloring', async () => {
            expect(await rowConfig({ icon_color: 'red' })).toMatchObject({ state_color: false });
        });

        it('accepts the deprecated state_color', async () => {
            expect(await rowConfig({ state_color: false })).toMatchObject({ state_color: false });
        });

        const subBadge = async (config) => {
            el.setConfig({ entity: 'sensor.main', ...config });
            el.hass = buildHass(states());
            await flushRender(el);
            return el.shadowRoot.querySelector('.entity:not(.state) state-badge');
        };

        it('applies the resolved color to a sub-entity icon badge', async () => {
            const badge = await subBadge({ entities: [{ entity: 'sensor.a', icon: true, color: 'blue' }] });
            expect(badge.color).toBe('var(--blue-color)');
            expect(badge.stateColor).toBeUndefined();
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/441
        it('lets a sub-entity icon inherit the row color', async () => {
            const badge = await subBadge({ color: 'none', entities: [{ entity: 'sensor.a', icon: true }] });
            expect(badge.stateColor).toBe(false);
        });

        it('lets a sub-entity color override the row color', async () => {
            const badge = await subBadge({
                color: 'none',
                entities: [{ entity: 'sensor.a', icon: true, color: 'state' }],
            });
            expect(badge.stateColor).toBe(true);
        });
    });

    describe('row layout', () => {
        beforeEach(() => {
            el.setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
            el.hass = buildHass({
                'sensor.main': { entity_id: 'sensor.main', state: '1', attributes: {} },
                'sensor.a': { entity_id: 'sensor.a', state: '2', attributes: {} },
            });
        });

        // See https://github.com/benct/lovelace-multiple-entity-row/issues/411 - catchInteraction
        // true makes hui-generic-entity-row wrap our slot in shrink-to-fit boxes
        // (.text-content.value > .state), which pins the row to its content width and breaks
        // user width/justify-content styling. It never gated HA's own interaction handling (that
        // is stopBubble's job, see #338), so it must stay false.
        it('leaves catchInteraction false so HA does not wrap the slot', async () => {
            await flushRender(el);
            expect(el.shadowRoot.querySelector('hui-generic-entity-row').catchInteraction).toBe(false);
        });

        it('does not wrap the entities row by default', async () => {
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entities-row').classList.contains('wrap')).toBe(false);
        });

        it('adds the wrap class when wrap is configured', async () => {
            el.setConfig({ entity: 'sensor.main', entities: ['sensor.a'], wrap: true });
            await flushRender(el);
            expect(el.shadowRoot.querySelector('.entities-row').classList.contains('wrap')).toBe(true);
        });

        // wrap only means anything for the horizontal layout - a column already stacks.
        it('ignores wrap in column layout', async () => {
            el.setConfig({ entity: 'sensor.main', entities: ['sensor.a'], column: true, wrap: true });
            await flushRender(el);
            const row = el.shadowRoot.querySelector('.entities-column');
            expect(row.classList.contains('wrap')).toBe(false);
        });
    });
});
