// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import './editor';
import type { MultipleEntityRowEditor } from './editor';
import type { MultipleEntityRowConfig } from './types';

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
    });
});
