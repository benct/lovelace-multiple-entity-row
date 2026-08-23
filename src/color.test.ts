import { describe, expect, it } from 'vitest';
import { badgeColorProps, computeCssColor, mappedColor, resolveColor, rowColorConfig } from './color';

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

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/441 - the row's color is
    // the default for its sub-entities, so `color: none` on the row restores the pre-4.9 look.
    describe('inherited scope', () => {
        it('falls back to the inherited color or state_color', () => {
            expect(resolveColor({}, { color: 'none' })).toEqual({ stateColor: false });
            expect(resolveColor({}, { color: 'red' })).toEqual({ cssColor: 'var(--red-color)' });
            expect(resolveColor({}, { state_color: false })).toEqual({ stateColor: false });
        });

        it('lets the entity override what it inherits', () => {
            expect(resolveColor({ color: 'state' }, { color: 'none' })).toEqual({ stateColor: true });
            expect(resolveColor({ state_color: true }, { color: 'none' })).toEqual({ stateColor: true });
        });

        it('does not inherit past an icon_color, which needs state coloring off', () => {
            expect(resolveColor({ icon_color: 'red' }, { color: 'state' })).toEqual({ stateColor: false });
        });

        it('ignores the inherited icon_color - it paints that badge only', () => {
            expect(resolveColor({}, { icon_color: 'red' })).toEqual({ stateColor: true });
        });
    });

    // See https://github.com/benct/lovelace-multiple-entity-row/issues/444 - a per-state color,
    // as state_icon is a per-state icon. Static, so it costs no template subscription. A match
    // is painted via CSS variables (mappedColor) and switches state coloring off here.
    describe('state_color map', () => {
        const map = { critical: 'red', warning: 'var(--warning-color)' };

        it('turns state coloring off for a matching state, which mappedColor then paints', () => {
            expect(resolveColor({ state_color: map }, undefined, 'critical')).toEqual({ stateColor: false });
            expect(mappedColor({ state_color: map }, 'critical')).toBe('var(--red-color)');
            expect(mappedColor({ state_color: map }, 'warning')).toBe('var(--warning-color)');
        });

        it('falls back to color, then the default, for an unmapped state', () => {
            expect(mappedColor({ state_color: map }, 'ok')).toBeUndefined();
            expect(resolveColor({ state_color: map, color: 'grey' }, undefined, 'ok')).toEqual({
                cssColor: 'var(--grey-color)',
            });
            expect(resolveColor({ state_color: map }, undefined, 'ok')).toEqual({ stateColor: true });
            expect(resolveColor({ state_color: map })).toEqual({ stateColor: true });
        });

        it('wins over color for a matching state', () => {
            expect(resolveColor({ state_color: map, color: 'grey' }, undefined, 'critical')).toEqual({
                stateColor: false,
            });
        });

        it("is not inherited - it is keyed by the owning entity's states", () => {
            expect(mappedColor({}, 'critical')).toBeUndefined();
            expect(resolveColor({}, { state_color: map, color: 'grey' }, 'critical')).toEqual({
                cssColor: 'var(--grey-color)',
            });
        });
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
