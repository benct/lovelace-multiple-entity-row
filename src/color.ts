// Support for HA's `color` option (frontend PR #53151, HA 2026.8), which replaced the boolean
// `state_color` with "state" | "none" | a theme color name | any CSS color.
//
// The card supports HA back to 2024.4, where state-badge's `color` property meant something else
// entirely - a raw CSS color applied unconditionally, with no notion of "state"/"none". Rather
// than sniff hass.config.version, resolveColor() maps a config value onto the state-badge
// properties that behave correctly on BOTH sides. See applyColor() for that mapping.

// Mirrors THEME_COLORS + YAML_ONLY_THEMES_COLORS in HA's src/common/color/compute-color.ts.
const THEME_COLORS = new Set([
    'primary',
    'accent',
    'red',
    'pink',
    'purple',
    'deep-purple',
    'indigo',
    'blue',
    'light-blue',
    'cyan',
    'teal',
    'green',
    'light-green',
    'lime',
    'yellow',
    'amber',
    'orange',
    'deep-orange',
    'brown',
    'light-grey',
    'grey',
    'dark-grey',
    'blue-grey',
    'black',
    'white',
    'primary-text',
    'secondary-text',
    'disabled',
]);

// A theme color name becomes its CSS variable; anything else is passed through as a CSS color.
// Equivalent to HA's computeCssColor, reimplemented because it is not exported to custom cards.
export const computeCssColor = (color: string): string => (THEME_COLORS.has(color) ? `var(--${color}-color)` : color);

export type ResolvedColor = { stateColor: boolean } | { cssColor: string };

type ColorConfig = { color?: string; state_color?: boolean | Record<string, string>; icon_color?: string };

/**
 * The `state_color` map entry for the current state as a CSS color, matched on the raw state
 * like state_icon (see #444). Painted through the icon_color CSS variables rather than
 * state-badge's `color`, because HA 2026.8 applies `color` only while the entity is active - a
 * mapping for `off` would silently do nothing, and the point of a map is that every entry paints.
 */
export const mappedColor = (config: ColorConfig, state?: string): string | undefined => {
    const color =
        typeof config.state_color === 'object' && config.state_color !== null && state !== undefined
            ? config.state_color[state]
            : undefined;
    return color === undefined ? undefined : computeCssColor(color);
};

// `color` wins, then the deprecated boolean `state_color`; undefined when neither is set. A
// `state_color` map is deliberately not an "explicit color" here: it is keyed by this entity's
// states, so it must not be inherited by sub-entities with different states.
const explicitColor = (config: ColorConfig): string | undefined =>
    config.color ?? (typeof config.state_color === 'boolean' ? (config.state_color ? 'state' : 'none') : undefined);

/**
 * Resolve a config's effective icon color into a form that can be handed to state-badge.
 *
 * A `state_color` map entry for the current `state` wins and, like `icon_color`, is painted
 * through CSS variables - so state coloring is switched off here and the caller paints it (see
 * mappedColor). Then `color`, then the deprecated boolean `state_color`, then the same pair on
 * `inherited` (the row, for a sub-entity - see #441: `color: none` on the row is documented as
 * restoring the pre-4.9 look, which it can only do if sub-entities follow it). With nothing set
 * the default is "state" (HA 2026.8 colors entity rows by default) - EXCEPT when `icon_color` is
 * configured, because that option paints the icon through CSS variables and an inline state
 * color would beat it, silently dropping the user's color whenever the entity is active. The
 * row's own `icon_color` is a paint on its badge only, so it is not inherited.
 */
export const resolveColor = (config: ColorConfig, inherited?: ColorConfig, state?: string): ResolvedColor => {
    if (mappedColor(config, state) !== undefined) return { stateColor: false };
    const color = explicitColor(config) ?? (config.icon_color || !inherited ? undefined : explicitColor(inherited));
    if (color === undefined) {
        return config.icon_color ? { stateColor: false } : { stateColor: true };
    }
    if (color === 'state') return { stateColor: true };
    if (color === 'none') return { stateColor: false };
    return { cssColor: computeCssColor(color) };
};

/**
 * Properties to spread onto a state-badge for a resolved color.
 *
 * "state"/"none" are expressed as the legacy boolean `stateColor`, which HA 2026.8 maps back onto
 * the new API internally - passing the literal string "state" as `color` would be rendered as raw
 * CSS by pre-2026.8 state-badges and silently produce no color at all.
 *
 * A custom color is passed already computed, so it lands as a valid CSS color on both: older
 * versions apply it unconditionally, 2026.8+ applies it while the entity is active.
 */
export const badgeColorProps = (resolved: ResolvedColor): { stateColor?: boolean; color?: string } =>
    'cssColor' in resolved ? { color: resolved.cssColor } : { stateColor: resolved.stateColor };

/**
 * The same mapping in config form, for the config object handed to hui-generic-entity-row (which
 * owns the main row's icon and forwards these to its own state-badge).
 *
 * A custom color only reaches the main icon on HA 2026.8+, since older hui-generic-entity-row
 * versions do not forward `color` at all - `icon_color` remains the way to paint it there.
 */
export const rowColorConfig = (resolved: ResolvedColor): { state_color?: boolean; color?: string } =>
    'cssColor' in resolved ? { color: resolved.cssColor } : { state_color: resolved.stateColor };
