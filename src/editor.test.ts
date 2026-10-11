// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import './editor';
import type { MultipleEntityRowEditor } from './editor';
import type { MultipleEntityRowConfig } from './types';
import { ACTIONS_SCHEMA, ADDITIONAL_TAB_SCHEMA } from './editor_schemas';

// Every field name an ha-form schema writes, grid wrappers included.
const schemaNames = (schema: readonly any[]): string[] =>
    schema.flatMap((item) => (item.schema ? schemaNames(item.schema) : [item.name]));

const buildHass = () => ({
    states: {},
    entities: {},
    locale: { number_format: 'comma_decimal', language: 'en-US' },
    localize: vi.fn((key: string) => key),
    callService: vi.fn(),
});

describe('multiple-entity-row-editor', () => {
    let el: MultipleEntityRowEditor;
    let configs: MultipleEntityRowConfig[];

    const setConfig = (config: Partial<MultipleEntityRowConfig>) => el.setConfig(config as MultipleEntityRowConfig);

    beforeEach(() => {
        sessionStorage.clear();
        configs = [];
        el = document.createElement('multiple-entity-row-editor') as MultipleEntityRowEditor;
        el.addEventListener('config-changed', (ev) => configs.push((ev as any).detail.config));
        (el as any).hass = buildHass();
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
    });

    it('registers the editor custom element', () => {
        expect(customElements.get('multiple-entity-row-editor')).toBeDefined();
    });

    // Templated configs are YAML-only: setConfig throws so HA's element editor falls back to
    // its code editor instead of letting ha-form mangle the Jinja strings.
    it('throws on a templated config to force the YAML editor', () => {
        expect(() => setConfig({ entity: 'sensor.main', name: '{{ x }}' })).toThrow(/code \(YAML\) editor/);
        expect(() =>
            setConfig({
                entity: 'sensor.main',
                entities: [{ entity: 'sensor.a', hide_if: { template: '{% if x %}true{% endif %}' } }],
            })
        ).toThrow();
        expect(() => setConfig({ entity: 'sensor.main', name: 'plain' })).not.toThrow();
    });

    it('clamps the selected tab when entities shrink below it', () => {
        setConfig({ entity: 'sensor.main', entities: ['sensor.a', 'sensor.b'] });
        (el as any)._selectedTab = 2;
        setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
        expect((el as any)._selectedTab).toBe(1);
    });

    describe('main tab form', () => {
        it('seeds show_state default ON and strips the redundant true on write-back', () => {
            setConfig({ entity: 'sensor.main' });
            expect((el as any)._mainFormData().show_state).toBe(true);

            (el as any)._mainValueChanged({ detail: { value: { entity: 'sensor.main', show_state: true } } });
            expect(configs).toHaveLength(1);
            expect('show_state' in configs[0]).toBe(false);
        });

        it('round-trips unit: false through the text form as the string "false"', () => {
            setConfig({ entity: 'sensor.main', unit: false });
            expect((el as any)._mainFormData().unit).toBe('false');

            (el as any)._mainValueChanged({ detail: { value: { entity: 'sensor.main', unit: 'false' } } });
            expect(configs[0].unit).toBe(false);
        });

        // `name: false` hides the name (and frees its space) but is otherwise unreachable from a
        // text selector, so it round-trips the same way as unit (see #341, #365).
        it('round-trips name: false through the text form as the string "false"', () => {
            setConfig({ entity: 'sensor.main', name: false });
            expect((el as any)._mainFormData().name).toBe('false');

            (el as any)._mainValueChanged({ detail: { value: { entity: 'sensor.main', name: 'false' } } });
            expect(configs[0].name).toBe(false);
        });

        it('leaves an ordinary name untouched', () => {
            setConfig({ entity: 'sensor.main', name: 'Kitchen' });
            expect((el as any)._mainFormData().name).toBe('Kitchen');

            (el as any)._mainValueChanged({ detail: { value: { entity: 'sensor.main', name: 'Kitchen' } } });
            expect(configs[0].name).toBe('Kitchen');
        });
    });

    describe('additional entities', () => {
        it('adds an empty entity and selects its tab', () => {
            setConfig({ entity: 'sensor.main' });
            (el as any)._addEntity();
            expect(configs[0].entities).toEqual([{}]);
            expect((el as any)._selectedTab).toBe(1);
        });

        it('deletes an entity and drops the entities key when the last one goes', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
            (el as any)._deleteAdditional(0);
            expect('entities' in configs[0]).toBe(false);
        });

        it('moves an entity and follows it with the selected tab', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a', 'sensor.b'] });
            (el as any)._moveAdditional(0, 1);
            expect(configs[0].entities).toEqual(['sensor.b', 'sensor.a']);
            expect((el as any)._selectedTab).toBe(2);
        });

        it('normalizes a string entity to an object when its form changes', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
            (el as any)._additionalValueChanged({ detail: { value: { entity: 'sensor.a', name: 'A' } } }, 0);
            expect(configs[0].entities).toEqual([{ entity: 'sensor.a', name: 'A' }]);
        });
    });

    describe('clipboard', () => {
        it('copies an entity and pastes it as a new one', () => {
            setConfig({ entity: 'sensor.main', entities: [{ entity: 'sensor.a', name: 'A' }] });
            (el as any)._copyAdditional(0);
            (el as any)._pasteEntity();
            expect(configs[0].entities).toEqual([
                { entity: 'sensor.a', name: 'A' },
                { entity: 'sensor.a', name: 'A' },
            ]);
        });

        it('copies main as a template with only per-entity-relevant fields', () => {
            setConfig({
                entity: 'sensor.main',
                name: 'Main',
                column: true,
                show_state: false,
                state_header: 'hdr',
                icon_color: 'red',
            });
            (el as any)._copyMainAsTemplate();
            (el as any)._pasteEntity();
            expect(configs[0].entities).toEqual([{ entity: 'sensor.main', name: 'Main', icon_color: 'red' }]);
        });

        // The allowlist predated the color API and per-entity actions, so the copy silently
        // dropped fields the entity form itself edits.
        it('copies main with every field the additional-entity form edits', () => {
            const fields = [
                ...schemaNames(ADDITIONAL_TAB_SCHEMA),
                ...schemaNames(ACTIONS_SCHEMA),
                'state_icon',
                'styles',
            ];
            const main = Object.fromEntries(fields.map((name) => [name, `${name}-value`]));
            setConfig({ ...main, entity: 'sensor.main' });
            (el as any)._copyMainAsTemplate();
            (el as any)._pasteEntity();
            expect(configs[0].entities![0]).toEqual({ ...main, entity: 'sensor.main' });
        });

        it('copies main with its YAML-only per-entity fields, but no row-only ones', () => {
            setConfig({
                entity: 'sensor.main',
                hide_if: 'off',
                default: '-',
                state_color: { on: 'red' },
                secondary_info: 'hello',
                name_gap: 8,
                reserve_header: false,
                wrap: true,
            });
            (el as any)._copyMainAsTemplate();
            (el as any)._pasteEntity();
            expect(configs[0].entities).toEqual([
                { entity: 'sensor.main', hide_if: 'off', default: '-', state_color: { on: 'red' } },
            ]);
        });

        it('cut removes the source entity and fills the clipboard', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a', 'sensor.b'] });
            (el as any)._cutAdditional(0);
            const last = configs[configs.length - 1];
            expect(last.entities).toEqual(['sensor.b']);
            expect((el as any)._clipboardEntity).toEqual({ entity: 'sensor.a' });
        });
    });

    describe('secondary info modes', () => {
        it('detects the mode from the config shape', () => {
            setConfig({ entity: 'sensor.main' });
            expect((el as any)._secondaryInfoMode()).toBe('none');
            setConfig({ entity: 'sensor.main', secondary_info: 'last-changed' });
            expect((el as any)._secondaryInfoMode()).toBe('generic');
            setConfig({ entity: 'sensor.main', secondary_info: 'hello' });
            expect((el as any)._secondaryInfoMode()).toBe('text');
            setConfig({ entity: 'sensor.main', secondary_info: { entity: 'sensor.a' } });
            expect((el as any)._secondaryInfoMode()).toBe('entity');
        });

        it('switching mode seeds a sensible starting value', () => {
            setConfig({ entity: 'sensor.main' });
            (el as any)._secondaryModeChanged({ detail: { value: { mode: 'entity' } } });
            expect(configs[0].secondary_info).toEqual({ entity: 'sensor.main' });

            (el as any)._secondaryModeChanged({ detail: { value: { mode: 'generic' } } });
            expect(configs[1].secondary_info).toBe('last-changed');
        });

        it('switching to none removes the key entirely', () => {
            setConfig({ entity: 'sensor.main', secondary_info: 'hello' });
            (el as any)._secondaryModeChanged({ detail: { value: { mode: 'none' } } });
            expect('secondary_info' in configs[0]).toBe(false);
        });
    });

    describe('state_icon rows', () => {
        it('propagates only complete rows to the config', () => {
            setConfig({ entity: 'sensor.main' });
            (el as any)._setStateIconRows('main', [
                ['on', 'mdi:door-open'],
                ['off', ''], // incomplete draft - stays local
            ]);
            expect(configs[0].state_icon).toEqual({ on: 'mdi:door-open' });
        });

        it('drops the state_icon key when all rows are removed', () => {
            setConfig({ entity: 'sensor.main', state_icon: { on: 'mdi:door-open' } });
            (el as any)._setStateIconRows('main', []);
            expect('state_icon' in configs[0]).toBe(false);
        });

        it('preserves an in-progress draft row across a setConfig round-trip', () => {
            setConfig({ entity: 'sensor.main' });
            (el as any)._setStateIconRows('main', [
                ['on', 'mdi:door-open'],
                ['off', ''],
            ]);
            // Simulate HA handing the (filtered) config back after config-changed.
            setConfig({ entity: 'sensor.main', state_icon: { on: 'mdi:door-open' } });
            expect((el as any)._stateIconRowsMain).toEqual([
                ['on', 'mdi:door-open'],
                ['off', ''],
            ]);
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/385
    describe('custom format', () => {
        it('shows a pipeline format as Custom in the form data instead of clobbering it', () => {
            setConfig({ entity: 'sensor.main', format: 'invert, precision3' });
            expect((el as any)._mainFormData().format).toBe('__custom__');
        });

        it('keeps the real format when the form echoes the Custom sentinel back', () => {
            setConfig({ entity: 'sensor.main', format: 'invert, precision3' });
            (el as any)._mainValueChanged({
                detail: { value: { entity: 'sensor.main', format: '__custom__' } },
            });
            expect(configs[0].format).toBe('invert, precision3');
        });

        it('picking Custom on a standard format preserves it and enters custom mode', () => {
            setConfig({ entity: 'sensor.main', format: 'kilo' });
            (el as any)._mainValueChanged({
                detail: { value: { entity: 'sensor.main', format: '__custom__' } },
            });
            expect(configs[0].format).toBe('kilo');
            expect((el as any)._isCustomFormat('main', 'kilo')).toBe(true);
        });

        it('picking a standard format leaves custom mode', () => {
            setConfig({ entity: 'sensor.main', format: 'invert, precision3' });
            (el as any)._mainValueChanged({
                detail: { value: { entity: 'sensor.main', format: '__custom__' } },
            });
            (el as any)._mainValueChanged({
                detail: { value: { entity: 'sensor.main', format: 'kilo' } },
            });
            const last = configs[configs.length - 1];
            expect(last.format).toBe('kilo');
            expect((el as any)._isCustomFormat('main', 'kilo')).toBe(false);
        });

        it('writes a per-entity custom format into that entity only', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
            (el as any)._setAdditionalFormat(0, 'invert, kilo3');
            expect(configs[0].entities).toEqual([{ entity: 'sensor.a', format: 'invert, kilo3' }]);
        });
    });

    // Editor-only state (custom-format mode, state-icon drafts) is stored per tab position, so
    // it has to move with its entity when entities are deleted or reordered.
    describe('per-entity editor state', () => {
        const roundTrip = () => setConfig(configs[configs.length - 1]);
        const pickCustom = (index: number, entity: string) =>
            (el as any)._additionalValueChanged({ detail: { value: { entity, format: '__custom__' } } }, index);

        it('keeps custom format mode on its entity when an earlier one is deleted', () => {
            setConfig({
                entity: 'sensor.main',
                entities: [
                    { entity: 'sensor.a', format: 'kilo' },
                    { entity: 'sensor.b', format: 'kilo' },
                ],
            });
            pickCustom(1, 'sensor.b');
            roundTrip();
            (el as any)._deleteAdditional(0);
            roundTrip();
            expect((el as any)._isCustomFormat('sub-0', 'kilo')).toBe(true);
            expect((el as any)._isCustomFormat('sub-1', 'kilo')).toBe(false);
        });

        it('drops custom format mode with a deleted entity', () => {
            setConfig({
                entity: 'sensor.main',
                entities: [
                    { entity: 'sensor.a', format: 'kilo' },
                    { entity: 'sensor.b', format: 'kilo' },
                ],
            });
            pickCustom(0, 'sensor.a');
            roundTrip();
            (el as any)._deleteAdditional(0);
            roundTrip();
            expect((el as any)._isCustomFormat('sub-0', 'kilo')).toBe(false);
        });

        it('moves custom format mode with a moved entity', () => {
            setConfig({
                entity: 'sensor.main',
                entities: [
                    { entity: 'sensor.a', format: 'kilo' },
                    { entity: 'sensor.b', format: 'kilo' },
                ],
            });
            pickCustom(0, 'sensor.a');
            roundTrip();
            (el as any)._moveAdditional(0, 1);
            roundTrip();
            expect((el as any)._isCustomFormat('sub-0', 'kilo')).toBe(false);
            expect((el as any)._isCustomFormat('sub-1', 'kilo')).toBe(true);
        });

        it('moves an in-progress state-icon draft with a moved entity', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a', 'sensor.b'] });
            (el as any)._setStateIconRows(0, [['', '']]);
            roundTrip();
            (el as any)._moveAdditional(0, 1);
            roundTrip();
            expect((el as any)._stateIconRowsAdditional.get(0)).toBeUndefined();
            expect((el as any)._stateIconRowsAdditional.get(1)).toEqual([['', '']]);
        });
    });

    describe('custom CSS block', () => {
        it('parses key: value lines into the styles object', () => {
            setConfig({ entity: 'sensor.main' });
            (el as any)._mainStylesChanged({ detail: { value: 'width: 80px\ncolor: "red"\n# comment\nbad-line' } });
            expect(configs[0].styles).toEqual({ width: '80px', color: 'red' });
        });

        it('removes the styles key when the block is emptied', () => {
            setConfig({ entity: 'sensor.main', styles: { width: '80px' } });
            (el as any)._mainStylesChanged({ detail: { value: '' } });
            expect('styles' in configs[0]).toBe(false);
        });

        it('writes per-entity styles into that entity only', () => {
            setConfig({ entity: 'sensor.main', entities: ['sensor.a'] });
            (el as any)._additionalStylesChanged({ detail: { value: 'color: red' } }, 0);
            expect(configs[0].entities).toEqual([{ entity: 'sensor.a', styles: { color: 'red' } }]);
        });

        // ha-code-editor replaces its whole document whenever the bound value differs from it,
        // so the value bound back after HA hands the config round must be the user's own text.
        describe('typing', () => {
            const codeEditor = async () => {
                await el.updateComplete;
                return el.shadowRoot!.querySelector('ha-code-editor') as HTMLElement & { value: string };
            };
            const type = async (text: string) => {
                (await codeEditor()).dispatchEvent(new CustomEvent('value-changed', { detail: { value: text } }));
                setConfig(configs[configs.length - 1]);
                return (await codeEditor()).value;
            };

            it('keeps a line whose value was just deleted', async () => {
                setConfig({ entity: 'sensor.main', styles: { color: 'red' } });
                expect((await codeEditor()).value).toBe('color: red');
                expect(await type('color: ')).toBe('color: ');
                expect('styles' in configs[configs.length - 1]).toBe(false);
            });

            it('keeps comments and quotes', async () => {
                setConfig({ entity: 'sensor.main' });
                expect(await type('# note\nwidth: "80px"')).toBe('# note\nwidth: "80px"');
                expect(configs[configs.length - 1].styles).toEqual({ width: '80px' });
            });

            it('shows the config again once it changes elsewhere', async () => {
                setConfig({ entity: 'sensor.main' });
                await type('# note\nwidth: 80px');
                setConfig({ entity: 'sensor.main', styles: { width: '10px' } });
                expect((await codeEditor()).value).toBe('width: 10px');
            });

            it('moves a draft with its entity', async () => {
                setConfig({
                    entity: 'sensor.main',
                    entities: ['sensor.a', { entity: 'sensor.b', styles: { color: 'blue' } }],
                });
                (el as any)._selectedTab = 1;
                await type('# a\ncolor: red');
                (el as any)._moveAdditional(0, 1);
                setConfig(configs[configs.length - 1]);
                expect((el as any)._selectedTab).toBe(2);
                expect((await codeEditor()).value).toBe('# a\ncolor: red');
                (el as any)._selectedTab = 1;
                expect((await codeEditor()).value).toBe('color: blue');
            });
        });
    });
});
