import { handleClick } from 'custom-card-helpers';

export const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj) && !!obj;

export const isUnavailable = (stateObj) => !stateObj || ['unknown', 'unavailable'].includes(stateObj.state);

export const hasToggle = (stateObj, config) => config.toggle === true && !isUnavailable(stateObj);

export const clickHandler = (node, entity, actionConfig) => () =>
    handleClick(node, node._hass, { entity, tap_action: actionConfig }, false, false);

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
