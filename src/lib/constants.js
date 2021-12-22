// Source:
// https://github.com/home-assistant/frontend/blob/dev/src/data/entity.ts
// https://github.com/home-assistant/frontend/blob/dev/src/data/translation.ts
// https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/cards/types.ts

export const UNAVAILABLE = 'unavailable';
export const UNKNOWN = 'unknown';
export const UNAVAILABLE_STATES = [UNAVAILABLE, UNKNOWN];

export const LAST_CHANGED = 'last-changed';
export const LAST_UPDATED = 'last-updated';

export const TIMESTAMP_FORMATS = ['relative', 'total', 'date', 'time', 'datetime'];

export const SECONDARY_INFO_VALUES = [
    'entity-id',
    'last-changed',
    'last-updated',
    'last-triggered',
    'position',
    'tilt-position',
    'brightness',
];

export const NumberFormat = {
    language: 'language',
    system: 'system',
    comma_decimal: 'comma_decimal',
    decimal_comma: 'decimal_comma',
    space_comma: 'space_comma',
    none: 'none',
};

export const TimeFormat = {
    language: 'language',
    system: 'system',
    am_pm: '12',
    twenty_four: '24',
};
