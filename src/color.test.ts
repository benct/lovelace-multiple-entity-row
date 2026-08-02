import { describe, expect, it } from 'vitest';
import { badgeColorProps, computeCssColor, resolveColor, rowColorConfig } from './color';

describe('computeCssColor', () => {
    it('maps theme color names to their CSS variable', () => {
        expect(computeCssColor('red')).toBe('var(--red-color)');
        expect(computeCssColor('deep-purple')).toBe('var(--deep-purple-color)');
        expect(computeCssColor('primary-text')).toBe('var(--primary-text-color)');
    });

    it('passes any other CSS color through unchanged', () => {
        expect(computeCssColor('#ff0000')).toBe('#ff0000');
        expect(computeCssColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
        expect(computeCssColor('var(--my-own-color)')).toBe('var(--my-own-color)');
    });
});

// See https://github.com/benct/lovelace-multiple-entity-row/issues/416 - HA 2026.8 replaced the
// boolean state_color with color ("state" | "none" | theme color | CSS color) and colors entity
// rows by default. The card follows that default so its rows match built-in ones.
describe('resolveColor', () => {
    it('defaults to state coloring', () => {
        expect(resolveColor({})).toEqual({ stateColor: true });
    });

    it('honors explicit state/none', () => {
        expect(resolveColor({ color: 'state' })).toEqual({ stateColor: true });
        expect(resolveColor({ color: 'none' })).toEqual({ stateColor: false });
    });

    it('computes custom colors', () => {
        expect(resolveColor({ color: 'red' })).toEqual({ cssColor: 'var(--red-color)' });
        expect(resolveColor({ color: '#abc' })).toEqual({ cssColor: '#abc' });
    });

    it('accepts the deprecated state_color as an alias', () => {
        expect(resolveColor({ state_color: true })).toEqual({ stateColor: true });
        expect(resolveColor({ state_color: false })).toEqual({ stateColor: false });
    });

    it('lets color win over state_color', () => {
        expect(resolveColor({ color: 'none', state_color: true })).toEqual({ stateColor: false });
    });

    // An inline state color would override the CSS variables icon_color paints with, so a
    // configured icon_color would otherwise vanish exactly when the entity is active.
    it('does not default to state coloring when icon_color is configured', () => {
        expect(resolveColor({ icon_color: 'red' })).toEqual({ stateColor: false });
    });

    it('still lets an explicit color win over icon_color', () => {
        expect(resolveColor({ icon_color: 'red', color: 'state' })).toEqual({ stateColor: true });
        expect(resolveColor({ icon_color: 'red', state_color: true })).toEqual({ stateColor: true });
    });
});

describe('badgeColorProps', () => {
    // Passing the literal "state" as `color` would be treated as a raw CSS color by pre-2026.8
    // state-badges and render nothing, so state/none always travel as the legacy boolean.
    it('expresses state/none as the legacy stateColor boolean', () => {
        expect(badgeColorProps({ stateColor: true })).toEqual({ stateColor: true });
        expect(badgeColorProps({ stateColor: false })).toEqual({ stateColor: false });
    });

    it('passes a computed custom color as color', () => {
        expect(badgeColorProps({ cssColor: 'var(--red-color)' })).toEqual({ color: 'var(--red-color)' });
    });
});

describe('rowColorConfig', () => {
    it('uses config-shaped keys for hui-generic-entity-row', () => {
        expect(rowColorConfig({ stateColor: true })).toEqual({ state_color: true });
        expect(rowColorConfig({ cssColor: '#abc' })).toEqual({ color: '#abc' });
    });
});
