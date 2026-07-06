// ha-form schemas for the visual editor. Adapted from the duczz/ha-multiple-entity-row fork.

// Sentinel dropdown value for "enter the format string by hand" - covers comma-separated
// pipelines (invert, precision3) and rarely-used digit suffixes not worth dropdown entries.
export const CUSTOM_FORMAT = '__custom__';

const FORMAT_OPTIONS = [
    { value: '', label: 'No format' },
    { value: 'brightness', label: 'Brightness (0-255 → %)' },
    { value: 'percent', label: 'Percent (value × 100 → x %)' },
    { value: 'duration', label: 'Duration (seconds → h:mm:ss)' },
    { value: 'duration-m', label: 'Duration (milliseconds)' },
    { value: 'duration-h', label: 'Duration (hours)' },
    { value: 'precision0', label: 'Precision 0 decimals' },
    { value: 'precision1', label: 'Precision 1 decimal' },
    { value: 'precision2', label: 'Precision 2 decimals' },
    { value: 'precision3', label: 'Precision 3 decimals' },
    // The runtime supports precision4..9 and kilo/mega/milli digit suffixes too; those stay
    // YAML-only so the dropdown isn't cluttered with rarely-used variants.
    { value: 'kilo', label: 'Kilo (value / 1,000)' },
    { value: 'mega', label: 'Mega (value / 1,000,000)' },
    { value: 'milli', label: 'Milli (value × 1,000)' },
    { value: 'invert', label: 'Invert (value × -1)' },
    { value: 'position', label: 'Position (100 - value)' },
    { value: 'celsius_to_fahrenheit', label: '°C → °F' },
    { value: 'fahrenheit_to_celsius', label: '°F → °C' },
    { value: 'upper', label: 'Text: UPPERCASE' },
    { value: 'lower', label: 'Text: lowercase' },
    { value: 'capitalize', label: 'Text: Capitalize first letter' },
    { value: 'title', label: 'Text: Title Case' },
    { value: 'relative', label: 'Timestamp: relative' },
    { value: 'total', label: 'Timestamp: total' },
    { value: 'date', label: 'Timestamp: date' },
    { value: 'time', label: 'Timestamp: time' },
    { value: 'datetime', label: 'Timestamp: date + time' },
    { value: CUSTOM_FORMAT, label: 'Custom…' },
];

export const KNOWN_FORMAT_VALUES = new Set(FORMAT_OPTIONS.map((o) => o.value).filter((v) => v && v !== CUSTOM_FORMAT));

// Tab "1" - the main entity. Writes to TOP-LEVEL config keys (config.entity, config.name, ...).
export const MAIN_TAB_SCHEMA = [
    { name: 'entity', required: true, selector: { entity: {} } },
    {
        type: 'grid',
        schema: [
            { name: 'name', selector: { text: {} } },
            { name: 'attribute', selector: { text: {} } },
        ],
    },
    {
        type: 'grid',
        schema: [
            { name: 'unit', selector: { text: {} } },
            { name: 'icon', selector: { icon: {} } },
        ],
    },
    { name: 'icon_color', selector: { text: {} } },
    {
        type: 'grid',
        schema: [
            { name: 'show_state', default: true, selector: { boolean: {} } },
            { name: 'state_color', selector: { boolean: {} } },
        ],
    },
    {
        type: 'grid',
        schema: [
            { name: 'toggle', selector: { boolean: {} } },
            { name: 'column', selector: { boolean: {} } },
        ],
    },
    {
        type: 'grid',
        schema: [
            { name: 'show_state_first', selector: { boolean: {} } },
            { name: 'hide_unavailable', selector: { boolean: {} } },
        ],
    },
    { name: 'state_header', selector: { text: {} } },
    { name: 'image', selector: { text: {} } },
    // format must stay the LAST entry: the editor renders the custom-format text box directly
    // after this form, so it appears right under the format dropdown; the action selectors
    // render as a separate form below it.
    { name: 'format', selector: { select: { mode: 'dropdown', options: FORMAT_OPTIONS } } },
];

// Row-level actions live in the Main tab, in the same format as the per-entity ones - a
// separate "Interactions" panel on screen alongside a tab's action selectors read as two
// competing blocks. Rendered as its own form so the custom-format box can sit between.
export const ACTIONS_SCHEMA = [
    { name: 'tap_action', selector: { ui_action: { default_action: 'more-info' } } },
    { name: 'hold_action', selector: { ui_action: { default_action: 'none' } } },
    { name: 'double_tap_action', selector: { ui_action: { default_action: 'none' } } },
];

// Additional-entity tabs. Writes to config.entities[i-1]. Also reused for the secondary-info
// entity form (which gets no ACTIONS_SCHEMA - secondary info has no pointer handlers).
export const ADDITIONAL_TAB_SCHEMA = [
    { name: 'entity', selector: { entity: {} } },
    {
        type: 'grid',
        schema: [
            { name: 'name', selector: { text: {} } },
            { name: 'attribute', selector: { text: {} } },
        ],
    },
    {
        type: 'grid',
        schema: [
            { name: 'unit', selector: { text: {} } },
            { name: 'icon', selector: { icon: {} } },
        ],
    },
    { name: 'icon_color', selector: { text: {} } },
    {
        type: 'grid',
        schema: [
            { name: 'state_color', selector: { boolean: {} } },
            { name: 'toggle', selector: { boolean: {} } },
        ],
    },
    { name: 'hide_unavailable', selector: { boolean: {} } },
    // Last for the same reason as MAIN_TAB_SCHEMA - the custom-format box renders right after.
    { name: 'format', selector: { select: { mode: 'dropdown', options: FORMAT_OPTIONS } } },
];

export const LABELS: Record<string, string> = {
    entity: 'Entity',
    attribute: 'Attribute',
    name: 'Name override',
    unit: 'Unit',
    icon: 'Icon',
    icon_color: 'Icon color (CSS value, e.g. red, #ff0000, var(--my-color))',
    image: 'Image URL',
    format: 'Format',
    show_state: 'Show main entity state',
    show_state_first: 'State before entities',
    state_header: 'State header label',
    state_color: 'State color',
    column: 'Column layout',
    toggle: 'Show as toggle',
    hide_unavailable: 'Hide if unavailable',
    tap_action: 'Tap action',
    hold_action: 'Hold action',
    double_tap_action: 'Double-tap action',
};
