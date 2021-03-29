import { computeEntity, computeStateDomain, formatDate, formatDateTime, formatTime } from 'custom-card-helpers';
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

export const entityValue = (stateObj, config) =>
    config.attribute !== undefined ? stateObj.attributes[config.attribute] : stateObj.state;

export const entityUnit = (stateObj, config) =>
    config.unit === false
        ? null
        : config.attribute !== undefined
        ? config.unit
        : config.unit || stateObj.attributes.unit_of_measurement;

export const entityStateDisplay = (hass, stateObj, config) => {
    if (isUnavailable(stateObj)) {
        return hass.localize(`state.default.${stateObj.state}`);
    }

    const domain = computeStateDomain(stateObj);
    const computeDisplay = (value) =>
        (stateObj.attributes.device_class &&
            hass.localize(`component.${domain}.state.${stateObj.attributes.device_class}.${value}`)) ||
        hass.localize(`component.${domain}.state._.${value}`) ||
        value;

    if (config.attribute) {
        return config.attribute in stateObj.attributes
            ? `${computeDisplay(stateObj.attributes[config.attribute])}${config.unit ? ` ${config.unit}` : ''}`
            : hass.localize('state.default.unavailable');
    }

    if (config.unit !== false && (config.unit || stateObj.attributes.unit_of_measurement)) {
        return `${stateObj.state} ${config.unit || stateObj.attributes.unit_of_measurement}`;
    }

    if (domain === 'input_datetime') {
        let date;
        if (!stateObj.attributes.has_time) {
            date = new Date(stateObj.attributes.year, stateObj.attributes.month - 1, stateObj.attributes.day);
            return formatDate(date, hass.language);
        }
        if (!stateObj.attributes.has_date) {
            const now = new Date();
            date = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDay(),
                stateObj.attributes.hour,
                stateObj.attributes.minute
            );
            return formatTime(date, hass.language);
        }

        date = new Date(
            stateObj.attributes.year,
            stateObj.attributes.month - 1,
            stateObj.attributes.day,
            stateObj.attributes.hour,
            stateObj.attributes.minute
        );
        return formatDateTime(date, hass.language);
    }

    return computeDisplay(stateObj.state);
};

export const entityStyles = (config) =>
    isObject(config?.styles)
        ? Object.keys(config.styles)
              .map((key) => `${key}: ${config.styles[key]};`)
              .join('')
        : '';
