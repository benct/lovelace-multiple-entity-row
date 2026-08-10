import { describe, expect, it } from 'vitest';
import { style } from './styles';

// jsdom can't do layout, so pin the mechanism at the source level instead.
const cssText = style((strings, ...values) => strings.reduce((out, s, i) => out + s + (values[i] ?? ''), ''));

describe('entity spacing', () => {
    // The inter-entity gap must be padding, not margin: HA's row shows cursor:pointer over the
    // gap but stops slotted clicks at the slot, so a margin gap is dead space that looks
    // clickable. Padding keeps the gap inside the entity's click target (see #432).
    it('uses padding so the gap stays clickable', () => {
        expect(cssText).toMatch(/\.entities-row \.entity \{[^}]*padding-right: 16px/);
        expect(cssText).not.toMatch(/margin-right: 16px/);
    });
});
