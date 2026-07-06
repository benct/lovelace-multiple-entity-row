import { secondsToDuration } from './lib/seconds_to_duration';
import { formatNumber } from './lib/format_number';
import { computeStateDisplay } from './lib/compute_state_display';
import { isObject, isUnavailable } from './util';

export const checkEntity = (config) => {
    if (isObject(config) && !(config.entity || config.attribute || config.icon)) {
        throw new Error(`Entity object requires at least one 'entity', 'attribute' or 'icon'.`);
    } else if (typeof config === 'string' && config === '') {
        throw new Error('Entity ID string must not be blank.');
    } else if (typeof config !== 'string' && !isObject(config)) {
        throw new Error('Entity config must be a valid entity ID string or entity object.');
    }
};

export const computeEntity = (entityId) => entityId.substr(entityId.indexOf('.') + 1);

// Decimal digit count of a raw string value (e.g. "1.2345" -> 4), or undefined if value isn't a
// string with a decimal point. Used to preserve a source value's precision through a
// scale/sign transform, since arithmetic (e.g. `value / 1000`) coerces the string to a number
// before it reaches formatNumber, losing the "keep original decimal digits" behavior it would
// otherwise apply (see #304).
const decimalDigits = (value) =>
    typeof value === 'string' && value.includes('.') ? value.split('.')[1].length : undefined;

// Shared implementation for the kilo/mega/milli formats: divides by the given factor, and applies
// either the default 2-decimal cap (bare `kilo`/`mega`/`milli`, digits === undefined) or an
// explicit user-requested precision (`kilo3`, `mega1`, `milli0`, ...).
const scaledFormat = (value, divisor, digits, locale) => {
    if (digits === undefined) {
        return formatNumber(value / divisor, locale, { maximumFractionDigits: 2 });
    }
    const precision = parseInt(digits, 10);
    return formatNumber(value / divisor, locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    });
};

// precision<N>/kilo<N>/mega<N>/milli<N> parse a trailing digit off the format string. `kilo`,
// `mega` and `milli` alone are valid (their own documented 2-decimal default); `precision` alone
// is not, since it has no bare-word default. Anything else with one of these prefixes - e.g.
// "kiloX", or mid-typed in a config editor before the digit is added - doesn't match this pattern
// at all. Rather than crash (Intl.NumberFormat throws for a NaN minimumFractionDigits) or guess at
// a fallback precision, that's treated as an incomplete format for this render, falling through to
// the same official-entity-formatter path used when no format is configured at all (see #387).
const DIGIT_SUFFIX_PREFIXES = ['precision', 'kilo', 'mega', 'milli'];
const DIGIT_SUFFIX_FORMAT = /^(precision|kilo|mega|milli)(\d+)?$/;

// The match, or null if config.format isn't a complete precision/kilo/mega/milli format.
const matchDigitSuffixFormat = (format) => {
    const match = DIGIT_SUFFIX_FORMAT.exec(format);
    return match && (match[1] !== 'precision' || match[2] !== undefined) ? match : null;
};
const isIncompleteDigitSuffixFormat = (format) =>
    DIGIT_SUFFIX_PREFIXES.some((prefix) => format?.startsWith(prefix)) && !matchDigitSuffixFormat(format);

// Numeric formats can be combined comma-separated (`format: invert, precision3` - see #385).
// Only value-transforming numeric segments compose: the raw number threads through every
// segment and gets locale-formatted exactly once at the end, so a segment never re-parses
// another segment's formatted output (which would break on locale separators like "1,234.5").
// Duration, timestamp and string formats don't participate - they produce display strings, not
// numbers, so anything else in a comma list falls through to the normal single-format handling.
const PIPELINE_SEGMENT =
    /^(brightness|percent|invert|position|celsius_to_fahrenheit|fahrenheit_to_celsius|kilo\d*|mega\d*|milli\d*|precision\d+)$/;

const splitFormat = (format) =>
    typeof format === 'string'
        ? format
              .split(',')
              .map((segment) => segment.trim())
              .filter(Boolean)
        : [];

const formatPipeline = (segments, rawValue, unit, locale) => {
    let value = parseFloat(rawValue);
    // Display precision: an explicit precisionN (or kilo3-style digit suffix) always wins;
    // otherwise the last segment's own default applies (bare kilo's 2-decimal cap, etc.);
    // with neither, the source value's decimal digits are preserved (see #304).
    let digits = decimalDigits(rawValue);
    let maxDigits;
    let explicit = false;
    const defaultCap = (cap) => {
        if (!explicit) {
            digits = undefined;
            maxDigits = cap;
        }
    };

    for (const segment of segments) {
        const match = DIGIT_SUFFIX_FORMAT.exec(segment);
        if (match && match[1] === 'precision') {
            digits = parseInt(match[2], 10);
            maxDigits = undefined;
            explicit = true;
            continue;
        }
        if (match) {
            value = value / { kilo: 1000, mega: 1000000, milli: 1 / 1000 }[match[1]];
            if (match[2] !== undefined) {
                digits = parseInt(match[2], 10);
                maxDigits = undefined;
                explicit = true;
            } else {
                defaultCap(2);
            }
            continue;
        }
        switch (segment) {
            case 'brightness':
                value = Math.round((value / 255) * 100);
                unit = '%';
                defaultCap(0);
                break;
            case 'percent':
                value = value * 100;
                unit = '%';
                defaultCap(2);
                break;
            case 'invert':
                value = -value;
                break;
            case 'position':
                value = 100 - value;
                break;
            case 'celsius_to_fahrenheit':
                value = value * 1.8 + 32;
                defaultCap(0);
                break;
            case 'fahrenheit_to_celsius':
                value = ((value - 32) * 5) / 9;
                defaultCap(1);
                break;
        }
    }

    const options =
        digits !== undefined
            ? { minimumFractionDigits: digits, maximumFractionDigits: digits }
            : maxDigits !== undefined
            ? { maximumFractionDigits: maxDigits }
            : undefined;
    return `${formatNumber(value, locale, options)}${unit ? ` ${unit}` : ''}`;
};

// String-only transforms - operate on any value, including non-numeric text states (see #367).
const STRING_FORMATS = ['upper', 'lower', 'capitalize', 'title'];
const stringTransform = (format, value) => {
    switch (format) {
        case 'upper':
            return value.toUpperCase();
        case 'lower':
            return value.toLowerCase();
        case 'capitalize':
            return value.charAt(0).toUpperCase() + value.slice(1);
        case 'title':
            // Split-and-capitalize rather than a \b\w or \p{L} regex: \b\w mishandles words
            // starting with a non-ASCII letter ("über"), and \p{L} gets expanded by babel
            // into a ~9KiB character class that bloats the bundle.
            return value
                .split(/(\s+)/)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
    }
};

// Sets all three icon-color variables so the override is robust across HA versions; cascades
// from the styled element down into nested state-badges (see #325).
export const iconColorCss = (color) =>
    color ? `--paper-item-icon-color: ${color}; --mdc-icon-color: ${color}; --state-icon-color: ${color};` : '';

// The state_icon map's icon for the current state, or undefined (see #197).
export const stateIcon = (stateObj, config) =>
    isObject(config.state_icon) ? config.state_icon[stateObj.state] : undefined;

export const entityName = (stateObj, config) => {
    if (config.name === false) return null;
    return (
        config.name ||
        (config.entity ? stateObj.attributes.friendly_name || computeEntity(stateObj.entity_id) : null) ||
        null
    );
};

export const entityStateDisplay = (hass, stateObj, config) => {
    // HA 2023.9+ exposes hass.formatEntityState/formatEntityAttributeValue, which apply the
    // user's own locale/number-format/precision preferences the same way HA's own UI does.
    // Prefer them over our own formatNumber/computeStateDisplay reimplementation when present.
    const hasOfficialStateFormatter = typeof hass.formatEntityState === 'function';
    const hasOfficialAttributeFormatter = typeof hass.formatEntityAttributeValue === 'function';

    if (isUnavailable(stateObj)) {
        return hasOfficialStateFormatter
            ? hass.formatEntityState(stateObj)
            : hass.localize(`state.default.${stateObj.state}`);
    }

    let value = config.attribute ? stateObj.attributes[config.attribute] : stateObj.state;
    let unit =
        config.unit === false
            ? undefined
            : config.attribute !== undefined
            ? config.unit
            : config.unit || stateObj.attributes.unit_of_measurement;

    // Comma-separated numeric formats compose as a pipeline (see #385). Only kicks in when
    // every segment is a known numeric transform - otherwise the whole string falls through to
    // the single-format handling below, same as any other unrecognized format.
    const segments = splitFormat(config.format);
    if (segments.length > 1 && segments.every((segment) => PIPELINE_SEGMENT.test(segment))) {
        const pipelineValue = value === undefined || value === null ? 0 : value;
        if (!isNaN(parseFloat(pipelineValue)) && isFinite(pipelineValue)) {
            return formatPipeline(segments, pipelineValue, unit, hass.locale);
        }
        return `${pipelineValue}${unit ? ` ${unit}` : ''}`;
    }

    if (config.format && !isIncompleteDigitSuffixFormat(config.format)) {
        // A missing attribute (e.g. brightness/color_temp on a light that's off) is undefined,
        // not a number - treat it as 0 (empty for the string transforms) rather than letting it
        // flow through to the final template literal below as the literal string "undefined"
        // (see #225). A value that's some other non-numeric type (e.g. a genuine text attribute)
        // is left untouched, same as before.
        if (value === undefined || value === null) {
            value = STRING_FORMATS.includes(config.format) ? '' : 0;
        }
        if (STRING_FORMATS.includes(config.format)) {
            return `${stringTransform(config.format, String(value))}${unit ? ` ${unit}` : ''}`;
        }
        if (isNaN(parseFloat(value)) || !isFinite(value)) {
            // do nothing if not a number
        } else if (config.format === 'brightness') {
            value = Math.round((value / 255) * 100);
            unit = '%';
        } else if (config.format === 'percent') {
            // value × 100 → x % - for fraction-valued sensors (see #323)
            value = formatNumber(value * 100, hass.locale, { maximumFractionDigits: 2 });
            unit = '%';
        } else if (config.format === 'duration') {
            // secondsToDuration returns null for a zero duration; fall back to '0'
            // so the template literal below doesn't render the literal string "null".
            value = secondsToDuration(value) ?? '0';
            unit = undefined;
        } else if (config.format === 'duration-m') {
            value = secondsToDuration(value / 1000) ?? '0';
            unit = undefined;
        } else if (config.format === 'duration-h') {
            value = secondsToDuration(value * 3600) ?? '0';
            unit = undefined;
        } else if (matchDigitSuffixFormat(config.format)) {
            const [, type, digits] = matchDigitSuffixFormat(config.format);
            if (type === 'precision') {
                const precision = parseInt(digits, 10);
                value = formatNumber(parseFloat(value), hass.locale, {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision,
                });
            } else {
                value = scaledFormat(value, { kilo: 1000, mega: 1000000, milli: 1 / 1000 }[type], digits, hass.locale);
            }
        } else if (config.format === 'invert') {
            const precision = decimalDigits(value);
            value = formatNumber(
                value - value * 2,
                hass.locale,
                precision !== undefined
                    ? { minimumFractionDigits: precision, maximumFractionDigits: precision }
                    : undefined
            );
        } else if (config.format === 'position') {
            const precision = decimalDigits(value);
            value = formatNumber(
                100 - value,
                hass.locale,
                precision !== undefined
                    ? { minimumFractionDigits: precision, maximumFractionDigits: precision }
                    : undefined
            );
        } else if (config.format === 'celsius_to_fahrenheit') {
            value = formatNumber(value * 1.8 + 32, hass.locale, { maximumFractionDigits: 0 });
        } else if (config.format === 'fahrenheit_to_celsius') {
            value = formatNumber(((value - 32) * 5) / 9, hass.locale, { maximumFractionDigits: 1 });
        }
        return `${value}${unit ? ` ${unit}` : ''}`;
    }

    const modifiedStateObj = { ...stateObj, attributes: { ...stateObj.attributes, unit_of_measurement: unit } };

    if (config.attribute) {
        if (hasOfficialAttributeFormatter) {
            return hass.formatEntityAttributeValue(modifiedStateObj, config.attribute);
        }
        // A missing attribute is undefined, not a number or a real string - render an empty value
        // rather than the literal string "undefined" (same class of bug as #225, in a code path
        // that fix didn't cover since it only applies when a `format:` is configured).
        const displayValue =
            value === undefined || value === null ? '' : isNaN(value) ? value : formatNumber(value, hass.locale);
        return `${displayValue}${unit ? ` ${unit}` : ''}`;
    }

    return hasOfficialStateFormatter
        ? hass.formatEntityState(modifiedStateObj)
        : computeStateDisplay(hass.localize, modifiedStateObj, hass.locale, hass.entities);
};

export const entityStyles = (config) =>
    isObject(config?.styles)
        ? Object.keys(config.styles)
              .map((key) => `${key}: ${config.styles[key]};`)
              .join('')
        : '';
