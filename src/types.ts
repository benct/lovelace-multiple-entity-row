// Config and hass typings for the card and its editor. Adapted from the
// duczz/ha-multiple-entity-row fork's types.ts, adjusted to this card's schema.

export type LooseObject = Record<string, any>;

export interface HassEntity {
    entity_id: string;
    state: string;
    attributes: Record<string, any>;
    last_changed?: string;
    last_updated?: string;
}

export interface HASS {
    states: Record<string, HassEntity>;
    locale: { language: string; number_format?: string; time_format?: string; [key: string]: any };
    entities?: Record<string, any>;
    localize: (key: string, ...args: any[]) => string;
    formatEntityState?: (stateObj: HassEntity, state?: string) => string;
    formatEntityAttributeValue?: (stateObj: HassEntity, attribute: string, value?: any) => string;
    formatEntityName?: (entityOrId: HassEntity | string, name?: string) => string;
    callService: (domain: string, service: string, data?: LooseObject) => Promise<any>;
    [key: string]: any;
}

export interface ActionConfig {
    // HA 2024.8 renamed call-service → perform-action; the ui_action selector emits it, and
    // hass-action handles both. 'assist' arrived alongside.
    action:
        | 'more-info'
        | 'toggle'
        | 'call-service'
        | 'perform-action'
        | 'assist'
        | 'navigate'
        | 'url'
        | 'fire-dom-event'
        | 'none';
    entity?: string;
    [key: string]: any;
}

export interface HideIfObject {
    above?: number;
    below?: number;
    value?: any | any[];
    entity?: string;
    attribute?: string;
}

interface EntityOptions {
    format?: string;
    attribute?: string;
    unit?: string | false;
    name?: string | false;
    icon?: string | boolean;
    icon_color?: string;
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

export interface EntityConfig extends EntityOptions {
    entity?: string;
}

export interface MultipleEntityRowConfig extends EntityOptions {
    type: string;
    entity: string;
    show_state?: boolean;
    state_header?: string;
    image?: string;
    column?: boolean;
    // HA 2026.7+'s row editor renames `format` to `time_format` on save (see #386).
    time_format?: string;
    entities?: (string | EntityConfig)[];
    secondary_info?: string | EntityConfig;
}
