import fireEvent from './fireEvent';
import {
  ActionConfig,
  EntityConfig,
  HASS,
  HassEntity,
  HideIfObject,
  MultipleEntityRowConfig,
} from './types';

export const UNAVAILABLE = 'unavailable';
export const UNKNOWN = 'unknown';
export const UNAVAILABLE_STATES: readonly string[] = [UNAVAILABLE, UNKNOWN];

export const LAST_CHANGED = 'last-changed';
export const LAST_UPDATED = 'last-updated';
export const TIMESTAMP_ATTRIBUTES: readonly string[] = [LAST_CHANGED, LAST_UPDATED];

export const TIMESTAMP_FORMATS: readonly string[] = [
  'relative',
  'total',
  'date',
  'time',
  'datetime',
];

export const SECONDARY_INFO_VALUES: readonly string[] = [
  'entity-id',
  'last-changed',
  'last-updated',
  'last-triggered',
  'position',
  'tilt-position',
  'brightness',
];

export const isObject = (obj: unknown): obj is Record<string, any> =>
  typeof obj === 'object' && !Array.isArray(obj) && !!obj;

export const isUnavailable = (stateObj?: HassEntity | null): boolean =>
  !stateObj || UNAVAILABLE_STATES.includes(stateObj.state);

export const computeEntity = (entityId: string): string =>
  entityId.substring(entityId.indexOf('.') + 1);

export const entityName = (
  stateObj: HassEntity | undefined,
  config: EntityConfig,
): string | null => {
  if (config.name === false) return null;
  if (typeof config.name === 'string' && config.name.length) return config.name;
  if (config.entity && stateObj) {
    return stateObj.attributes.friendly_name || computeEntity(stateObj.entity_id) || null;
  }
  return null;
};

export const entityStyles = (config: EntityConfig | undefined): string =>
  isObject(config?.styles)
    ? Object.keys(config!.styles!)
        .map((key) => `${key}: ${config!.styles![key]};`)
        .join('')
    : '';

/**
 * Upstream #325: produce the inline CSS-variable triple that colors an
 * icon across the HA versions that historically used different vars:
 * - `--paper-item-icon-color` (legacy / hui-generic-entity-row)
 * - `--mdc-icon-color` (mwc-icon based)
 * - `--state-icon-color` (modern state-badge)
 *
 * Setting all three keeps the override robust across HA versions and
 * cascades naturally from a host element down into nested state-badges.
 */
export const iconColorCss = (color: string | undefined): string =>
  color
    ? `--paper-item-icon-color: ${color}; --mdc-icon-color: ${color}; --state-icon-color: ${color};`
    : '';

export const checkEntity = (config: unknown): void => {
  if (isObject(config)) {
    const obj = config as any;
    const hasAnyField = Object.keys(obj).length > 0;
    const hasRequiredField = obj.entity || obj.attribute || obj.icon;
    // Empty objects {} are allowed (in-progress editor state — runtime
    // simply skips rendering them). Reject only when fields are present
    // but none of the required ones — an incomplete-but-not-empty entity.
    if (hasAnyField && !hasRequiredField) {
      throw new Error(`Entity object requires at least one 'entity', 'attribute' or 'icon'.`);
    }
    return;
  }
  if (typeof config === 'string' && config === '') {
    throw new Error('Entity ID string must not be blank.');
  }
  if (typeof config !== 'string') {
    throw new Error('Entity config must be a valid entity ID string or entity object.');
  }
};

export const hideUnavailable = (
  stateObj: HassEntity | undefined,
  config: EntityConfig,
): boolean =>
  !!config.hide_unavailable &&
  (isUnavailable(stateObj) ||
    (!!config.attribute &&
      !TIMESTAMP_ATTRIBUTES.includes(config.attribute) &&
      stateObj!.attributes[config.attribute] === undefined));

export const hideIf = (
  stateObj: HassEntity | undefined,
  config: EntityConfig,
  hass?: HASS,
): boolean => {
  if (hideUnavailable(stateObj, config)) return true;
  if (config.hide_if === undefined) return false;

  // Upstream PR #280: `hide_if` may reference another entity to evaluate
  // against — `hide_if: { entity: 'switch.armed', value: 'off' }` hides
  // the row when switch.armed is off, regardless of the host entity's state.
  let evalStateObj = stateObj;
  let evalAttribute = config.attribute;
  if (isObject(config.hide_if)) {
    const hi = config.hide_if as any;
    if (hi.entity && hass) {
      evalStateObj = hass.states[hi.entity];
      if (hi.attribute) evalAttribute = hi.attribute;
    }
  }
  if (!evalStateObj) return false;

  const value = evalAttribute
    ? evalStateObj.attributes[evalAttribute]
    : evalStateObj.state;
  let hideValues: any[] = [];

  if (isObject(config.hide_if)) {
    const hi = config.hide_if as HideIfObject;
    if (hi.below !== undefined && value < hi.below) return true;
    if (hi.above !== undefined && value > hi.above) return true;
    if (hi.value !== undefined) hideValues = hideValues.concat(hi.value);
  } else {
    hideValues = hideValues.concat(config.hide_if);
  }
  return hideValues.some((hv) => (typeof hv === 'number' ? hv === +value : hv === value));
};

export const hasGenericSecondaryInfo = (config: unknown): boolean =>
  typeof config === 'string' && SECONDARY_INFO_VALUES.includes(config);

/** PR #280: pluck the entity reference out of a `hide_if` object form
 * (`hide_if: { entity: 'switch.X', value: 'off' }`) so it gets tracked
 * for re-renders just like primary entity references. */
const hideIfEntityRef = (hideIf: unknown): string | undefined => {
  if (isObject(hideIf) && typeof (hideIf as any).entity === 'string') {
    return (hideIf as any).entity;
  }
  return undefined;
};

export const getEntityIds = (config: MultipleEntityRowConfig): string[] => {
  const ids: (string | undefined)[] = [
    config.entity,
    hideIfEntityRef(config.hide_if),
  ];

  if (isObject(config.secondary_info)) {
    const si = config.secondary_info as EntityConfig;
    ids.push(si.entity, hideIfEntityRef(si.hide_if));
  }

  for (const e of config.entities ?? []) {
    if (typeof e === 'string') {
      ids.push(e);
    } else {
      ids.push(e.entity, hideIfEntityRef(e.hide_if));
    }
  }

  return ids.filter((id): id is string => !!id);
};

export const secondsToDuration = (d: number): string => {
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}`;
};

/**
 * Execute an action against HA. Decision of WHICH action (tap vs hold vs
 * double_tap) is made by the Card's pointer handlers; this just dispatches
 * the resolved one.
 */
export const runAction = (
  node: HTMLElement,
  hass: HASS,
  entityId: string,
  actionConfig?: ActionConfig,
): void => {
  const action = actionConfig?.action ?? 'none';

  switch (action) {
    case 'none':
      return;
    case 'more-info':
      // Upstream #188: honor `tap_action.entity` as a more-info target
      // override so `tap_action: { action: more-info, entity: light.x }`
      // opens light.x's dialog instead of the host row's entity.
      fireEvent(node, 'hass-more-info', {
        entityId: (actionConfig as any)?.entity || entityId,
      });
      return;
    case 'toggle':
      hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      return;
    case 'call-service': {
      const svc = actionConfig?.service;
      if (!svc) return;
      const [domain, service] = svc.split('.');
      hass.callService(domain, service, actionConfig?.service_data ?? actionConfig?.data ?? {});
      return;
    }
    case 'navigate': {
      const path = actionConfig?.navigation_path;
      if (path) {
        history.pushState(null, '', path);
        fireEvent(window, 'location-changed', { replace: false });
      }
      return;
    }
    case 'url': {
      const url = actionConfig?.url_path;
      if (url) window.open(url);
      return;
    }
  }
};
