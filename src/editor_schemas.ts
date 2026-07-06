// ha-form schemas for the visual editor. Adapted from the duczz/ha-multiple-entity-row fork.

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
];

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
    { name: 'hide_unavailable', selector: { boolean: {} } },
    { name: 'state_header', selector: { text: {} } },
    { name: 'image', selector: { text: {} } },
    { name: 'format', selector: { select: { mode: 'dropdown', options: FORMAT_OPTIONS } } },
    // Row-level actions live in the Main tab, in the same format as the per-entity ones -
    // a separate "Interactions" panel on screen alongside a tab's action selectors read as
    // two competing blocks.
    { name: 'tap_action', selector: { ui_action: { default_action: 'more-info' } } },
    { name: 'hold_action', selector: { ui_action: { default_action: 'none' } } },
    { name: 'double_tap_action', selector: { ui_action: { default_action: 'none' } } },
];

// Tabs "2".."N" - additional entities. Writes to config.entities[i-1]. Also reused for the
// secondary-info entity form, where the action selectors are inert (secondary info has no
// pointer handlers) - harmless.
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
    { name: 'format', selector: { select: { mode: 'dropdown', options: FORMAT_OPTIONS } } },
    { name: 'tap_action', selector: { ui_action: { default_action: 'more-info' } } },
    { name: 'hold_action', selector: { ui_action: { default_action: 'none' } } },
    { name: 'double_tap_action', selector: { ui_action: { default_action: 'none' } } },
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
    state_header: 'State header label',
    state_color: 'State color',
    column: 'Column layout',
    toggle: 'Show as toggle',
    hide_unavailable: 'Hide if unavailable',
    tap_action: 'Tap action',
    hold_action: 'Hold action',
    double_tap_action: 'Double-tap action',
};
