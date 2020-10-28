const SECONDARY_INFO_VALUES = [
    'entity-id',
    'last-changed',
    'last-updated',
    'last-triggered',
    'position',
    'tilt-position',
    'brightness',
];

export const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj) && !!obj;

export const isUnavailable = (stateObj) => !stateObj || ['unknown', 'unavailable'].includes(stateObj.state);

export const hasToggle = (stateObj, config) => config.toggle === true && !isUnavailable(stateObj);

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
