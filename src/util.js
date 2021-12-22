import { SECONDARY_INFO_VALUES, UNAVAILABLE_STATES } from './lib/constants';

export const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj) && !!obj;

export const isUnavailable = (stateObj) => !stateObj || UNAVAILABLE_STATES.includes(stateObj.state);

export const hideUnavailable = (stateObj, config) =>
    config.hide_unavailable &&
    (isUnavailable(stateObj) || (config.attribute && stateObj.attributes[config.attribute] === undefined));

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
