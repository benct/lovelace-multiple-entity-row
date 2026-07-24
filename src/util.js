import { LAST_CHANGED, LAST_UPDATED, SECONDARY_INFO_VALUES, UNAVAILABLE_STATES } from './lib/constants';

export const isObject = (obj) => typeof obj === 'object' && !Array.isArray(obj) && !!obj;

// bubbles + composed so the event crosses our shadow root up to HA's root-level listener.
export const fireEvent = (node, type, detail) => {
    const event = new Event(type, { bubbles: true, composed: true });
    event.detail = detail;
    node.dispatchEvent(event);
};

export const isUnavailable = (stateObj) => !stateObj || UNAVAILABLE_STATES.includes(stateObj.state);

export const hideUnavailable = (stateObj, config) =>
    config.hide_unavailable &&
    (isUnavailable(stateObj) ||
        (config.attribute &&
            ![LAST_CHANGED, LAST_UPDATED].includes(config.attribute) &&
            stateObj.attributes[config.attribute] === undefined));

export const hideIf = (stateObj, config, hass) => {
    if (hideUnavailable(stateObj, config)) {
        return true;
    }
    if (config.hide_if === undefined) {
        return false;
    }
    // A templated hide_if arrives here already collapsed to its boolean verdict (see
    // resolveTemplateFields in templates.ts). Plain booleans were never meaningful here before
    // (they can't equal a state string), so this branch is backward-safe.
    if (typeof config.hide_if === 'boolean') {
        return config.hide_if;
    }

    let value;
    if (isObject(config.hide_if) && (config.hide_if.entity || config.hide_if.attribute)) {
        // Evaluate against another entity and/or attribute instead of the displayed value (see
        // #280). A missing referenced entity yields undefined, so no criteria match and the
        // entity stays visible - deliberately not falling back to the entity's own state, which
        // would silently hide/show on the wrong value.
        const sourceObj = config.hide_if.entity ? hass?.states[config.hide_if.entity] : stateObj;
        value = config.hide_if.attribute ? sourceObj?.attributes[config.hide_if.attribute] : sourceObj?.state;
    } else {
        value = config.attribute ? stateObj.attributes[config.attribute] : stateObj.state;
    }
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

// hide_if.entity ids must be tracked too, or hasConfigOrEntitiesChanged would skip re-rendering
// when only the referenced entity's state changes and the row would never hide/unhide.
export const getEntityIds = (config) =>
    [config.entity, config.hide_if?.entity, config.secondary_info?.entity, config.secondary_info?.hide_if?.entity]
        .concat(
            config.entities?.flatMap((entity) =>
                typeof entity === 'string' ? entity : [entity.entity, entity.hide_if?.entity]
            )
        )
        .filter((entity) => entity);

// HA installs stub formatEntityName/formatEntityState/formatEntityAttributeValue functions on
// initial connection (returning raw, unformatted values) and replaces them asynchronously with
// the real implementations once translations load. None of that swap is otherwise observable, so
// without this check a row can get stuck showing stale/raw output until some unrelated entity
// state change happens to force a re-render.
const HASS_FORMATTER_KEYS = ['formatEntityName', 'formatEntityState', 'formatEntityAttributeValue'];

export const hasConfigOrEntitiesChanged = (node, changedProps) => {
    if (changedProps.has('config')) {
        return true;
    }

    // Template results arrive via our own render_template subscription push, not through a hass
    // assignment, so they need their own re-render trigger (see templates.ts).
    if (changedProps.has('_templateResults')) {
        return true;
    }

    if (changedProps.has('_hass')) {
        const oldHass = changedProps.get('_hass');
        // First hass assignment: if setConfig rendered in an earlier update batch (empty - no
        // hass yet), this is the update that must actually paint the row. Returning false here
        // left the row permanently blank until an unrelated config change (see #400 diagnosis;
        // likely the mechanism behind intermittent blank rows in #389).
        if (!oldHass) {
            return true;
        }
        if (HASS_FORMATTER_KEYS.some((key) => oldHass[key] !== node._hass[key])) {
            return true;
        }
        return node.entityIds.some((entity) => oldHass.states[entity] !== node._hass.states[entity]);
    }
    return false;
};
