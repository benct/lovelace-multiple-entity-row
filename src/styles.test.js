import { describe, expect, it } from 'vitest';
import { style } from './styles';

// jsdom can't do layout, so pin the mechanism at the source level instead.
const cssText = style((strings, ...values) => strings.reduce((out, s, i) => out + s + (values[i] ?? ''), ''));
const rules = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

describe('entity spacing', () => {
    // Margin, not padding: user `styles` margins replace this margin, but stacked on top of a
    // padding gap - the 4.10.1 regression that overflowed tuned rows on phones (see #432).
    it('uses margin so user style margins replace it instead of stacking', () => {
        expect(cssText).toMatch(/\.entities-row \.entity \{[^}]*margin-inline-end: 16px/);
        expect(cssText).not.toMatch(/padding-(right|inline-end): 16px/);
    });

    // The margin gap is dead space to HA (slotted clicks stop at the slot), so each entity's
    // hit area must be extended across it without affecting layout (see #432).
    it('extends the hit area across the gap with a layout-neutral pseudo-element', () => {
        expect(cssText).toMatch(/\.entities-row \.entity:not\(:last-of-type\)::after/);
        expect(cssText).toMatch(/inset-inline-end: -16px/);
        expect(cssText).toMatch(/\.entities-row \.entity \{[^}]*position: relative/);
    });

    // Physical sides don't flip in right-to-left languages: the gaps landed on the wrong side
    // (the last two entities touched) and name:false pushed entities against the icon.
    it('uses only inline-axis properties for horizontal spacing', () => {
        expect(rules).not.toMatch(/(margin|padding)-(left|right)|[\s;{](left|right):/);
        expect(rules).toMatch(/\.no-name \{[^}]*margin-inline-start: auto/);
    });
});

describe('toggle alignment', () => {
    // HA's toggle host is display:flex with no horizontal alignment; without this it hugs the
    // left edge of any slot wider than the switch (see #436).
    it('centers ha-entity-toggle within its slot', () => {
        expect(cssText).toMatch(/\.entity ha-entity-toggle \{[^}]*justify-content: center/);
    });
});
