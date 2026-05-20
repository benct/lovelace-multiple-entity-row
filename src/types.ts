export type LooseObject = Record<string, any>;

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
  context?: Record<string, any>;
}

export interface HassLocale {
  language: string;
  number_format?: string;
  time_format?: string;
  [key: string]: any;
}

export interface HASS {
  states: Record<string, HassEntity>;
  locale: HassLocale;
  entities?: Record<string, any>;
  localize: (key: string, ...args: any[]) => string;
  formatEntityState?: (stateObj: HassEntity, state?: string) => string;
  formatEntityAttributeValue?: (stateObj: HassEntity, attribute: string, value?: any) => string;
  formatEntityName?: (entityOrId: HassEntity | string, name?: string) => string;
  callService: (domain: string, service: string, data?: LooseObject) => Promise<any>;
  performAction?: (args: { action: string; data?: LooseObject }) => Promise<any>;
  [key: string]: any;
}

export type ActionType =
  | 'more-info'
  | 'toggle'
  | 'call-service'
  | 'navigate'
  | 'url'
  | 'none';

export interface ActionConfig {
  action: ActionType;
  service?: string;
  service_data?: LooseObject;
  data?: LooseObject;
  navigation_path?: string;
  url_path?: string;
  [key: string]: any;
}

export interface HideIfObject {
  above?: number;
  below?: number;
  value?: any | any[];
}

export interface EntityFormatConfig {
  format?: string;
  attribute?: string;
  unit?: string | false;
  name?: string | false;
  icon?: string | boolean;
  /** Upstream #325: arbitrary CSS color for the icon. Any CSS color value
   * works (`red`, `#ff0000`, `var(--my-color)`, `rgb(...)`). */
  icon_color?: string;
  /** Upstream #197: state-based icon override map.
   * `state_icon: { on: 'mdi:door-open', off: 'mdi:door-closed' }` */
  state_icon?: Record<string, string>;
  state_color?: boolean;
  toggle?: boolean;
  hide_unavailable?: boolean;
  hide_if?: any | any[] | HideIfObject;
  styles?: Record<string, string>;
  default?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface EntityConfig extends EntityFormatConfig {
  entity?: string;
}

export interface MultipleEntityRowConfig extends EntityFormatConfig {
  type: 'custom:multiple-entity-row' | string;
  entity: string;
  show_state?: boolean;
  state_header?: string;
  image?: string;
  column?: boolean;
  entities?: (string | EntityConfig)[];
  secondary_info?: string | EntityConfig;
}

export interface LovelaceRow extends HTMLElement {
  hass?: HASS;
  setConfig(config: MultipleEntityRowConfig): void;
}
