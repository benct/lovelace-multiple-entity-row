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

    if (config.format) {
        if (isNaN(parseFloat(value)) || !isFinite(value)) {
            // do nothing if not a number
        } else if (config.format === 'brightness') {
            value = Math.round((value / 255) * 100);
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
        } else if (config.format.startsWith('precision')) {
            const precision = parseInt(config.format.slice(-1), 10);
            value = formatNumber(parseFloat(value), hass.locale, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
            });
        } else if (config.format === 'kilo') {
            value = formatNumber(value / 1000, hass.locale, { maximumFractionDigits: 2 });
        } else if (config.format === 'invert') {
            value = formatNumber(value - value * 2, hass.locale);
        } else if (config.format === 'position') {
            value = formatNumber(100 - value, hass.locale);
        } else if (config.format === 'celsius_to_fahrenheit') {
            value = formatNumber(value * 1.8 + 32, hass.locale, { maximumFractionDigits: 0 });
        } else if (config.format === 'fahrenheit_to_celsius') {
            value = formatNumber(((value - 32) * 5) / 9, hass.locale, { maximumFractionDigits: 1 });
        }
        return `${value}${unit ? ` ${unit}` : ''}`;
    }

    const modifiedStateObj = { ...stateObj, attributes: { ...stateObj.attributes, unit_of_measurement: unit } };

    if (config.attribute) {
        return hasOfficialAttributeFormatter
            ? hass.formatEntityAttributeValue(modifiedStateObj, config.attribute)
            : `${isNaN(value) ? value : formatNumber(value, hass.locale)}${unit ? ` ${unit}` : ''}`;
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
