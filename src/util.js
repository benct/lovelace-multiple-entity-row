import { SECONDARY_INFO_VALUES, UNAVAILABLE_STATES } from './lib/constants';

export const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj) && !!obj;

export const isUnavailable = (stateObj) => !stateObj || UNAVAILABLE_STATES.includes(stateObj.state);

export const hideUnavailable = (stateObj, config) =>
    config.hide_unavailable &&
    (isUnavailable(stateObj) ||
        (config.attribute &&
            stateObj.attributes[config.attribute] === undefined &&
            stateObj[config.attribute] === undefined));

export const hideIf = (stateObj, config) => {
    if (hideUnavailable(stateObj, config)) {
        return true;
    }
    if (config.hide_if === undefined) {
        return false;
    }

    const value = config.attribute ? stateObj.attributes[config.attribute] : stateObj.state;
    let hideValues = [];

    if (isObject(config.hide_if)) {
        if (config.hide_if.below && value < config.hide_if.below) {
            return true;
        }
        if (config.hide_if.above && value > config.hide_if.above) {
            return true;
        }
        if (config.hide_if.value) {
            hideValues = hideValues.concat(config.hide_if.value);
        }
    } else {
        hideValues = hideValues.concat(config.hide_if);
    }
    return hideValues.some((hideValue) => (typeof hideValue === 'number' ? hideValue === +value : hideValue === value));
};

export const hasGenericSecondaryInfo = (config) => typeof config === 'string' && SECONDARY_INFO_VALUES.includes(config);

export const getEntityIds = (config) =>
    [config.entity, config.secondary_info?.entity]
        .concat(config.entities?.map((entity) => (typeof entity === 'string' ? entity : entity.entity)))
        .filter((entity) => entity);

export const hasConfigOrEntitiesChanged = (node, changedProps) => {
    if (changedProps.has('config')) {
        return true;
    }

    const oldHass = changedProps.get('_hass');
    if (oldHass) {
        return node.entityIds.some((entity) => oldHass.states[entity] !== node._hass.states[entity]);
    }
    return false;
};
