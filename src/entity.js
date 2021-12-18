import { computeEntity, computeStateDisplay, formatNumber, secondsToDuration } from 'custom-card-helpers';
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

export const entityName = (stateObj, config) => {
    if (config.name === false) return null;
    return (
        config.name ||
        (config.entity ? stateObj.attributes.friendly_name || computeEntity(stateObj.entity_id) : null) ||
        null
    );
};

export const entityStateDisplay = (hass, stateObj, config) => {
    if (isUnavailable(stateObj)) {
        return hass.localize(`state.default.${stateObj.state}`);
    }

    const value = config.attribute ? stateObj.attributes[config.attribute] : stateObj.state;
    const unit =
        config.unit === false
            ? undefined
            : config.attribute !== undefined
            ? config.unit
            : config.unit || stateObj.attributes.unit_of_measurement;

    if (config.format) {
        if (isNaN(parseFloat(value)) || !isFinite(value)) {
            return value;
        }
        if (config.format === 'brightness') {
            return `${Math.round((value / 255) * 100)} %`;
        }
        if (config.format === 'duration') {
            return secondsToDuration(value);
        }
        if (config.format.startsWith('precision')) {
            const precision = parseInt(config.format.slice(-1), 10);
            const formatted = formatNumber(parseFloat(value), hass.locale, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
            });
            return `${formatted}${unit ? ` ${unit}` : ''}`;
        }
        return value;
    }

    if (config.attribute) {
        return `${isNaN(value) ? value : formatNumber(value, hass.locale)}${unit ? ` ${unit}` : ''}`;
    }

    const modifiedStateObj = { ...stateObj, attributes: { ...stateObj.attributes, unit_of_measurement: unit } };

    return computeStateDisplay(hass.localize, modifiedStateObj, hass.locale);
};

export const entityStyles = (config) =>
    isObject(config?.styles)
        ? Object.keys(config.styles)
              .map((key) => `${key}: ${config.styles[key]};`)
              .join('')
        : '';
