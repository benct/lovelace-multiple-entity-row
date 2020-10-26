import { computeEntity, computeStateDomain } from 'custom-card-helpers';
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

export const entityName = (stateObj, name) => {
    if (name === false) return null;
    if (name !== undefined) return name;
    return stateObj.attributes.friendly_name || computeEntity(stateObj.entity_id) || '';
};

export const entityRawValue = (stateObj, config) =>
    config.attribute !== undefined ? stateObj.attributes[config.attribute] : stateObj.state;

export const entityStateDisplay = (hass, stateObj, config) => {
    if (isUnavailable(stateObj)) {
        return hass.localize(`state.default.${stateObj.state}`);
    }

    if (config.attribute) {
        return config.attribute in stateObj.attributes
            ? stateObj.attributes[config.attribute] + (config.unit || '')
            : hass.localize('state.default.unavailable');
    }

    if (config.unit !== false && (config.unit || stateObj.attributes.unit_of_measurement)) {
        return `${stateObj.state} ${config.unit || stateObj.attributes.unit_of_measurement}`;
    }

    const domain = computeStateDomain(stateObj);
    return (
        (stateObj.attributes.device_class &&
            hass.localize(`component.${domain}.state.${stateObj.attributes.device_class}.${stateObj.state}`)) ||
        hass.localize(`component.${domain}.state._.${stateObj.state}`) ||
        stateObj.state
    );
};

export const entityStyles = (config) =>
    isObject(config?.styles)
        ? Object.keys(config.styles)
              .map((key) => `${key}: ${config.styles[key]};`)
              .join('')
        : '';
