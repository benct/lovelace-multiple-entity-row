import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';

import {
  TIMESTAMP_FORMATS,
  TIMESTAMP_ATTRIBUTES,
  checkEntity,
  entityName,
  entityStyles,
  getEntityIds,
  hasGenericSecondaryInfo,
  hideIf,
  iconColorCss,
  isObject,
  runAction,
} from './helpers';
import { entityStateDisplay } from './format';
import type {
  ActionConfig,
  EntityConfig,
  HASS,
  HassEntity,
  MultipleEntityRowConfig,
} from './types';
import styles from './styles.css';

interface ResolvedEntity extends EntityConfig {
  stateObj?: HassEntity;
}

interface ActionBundle {
  entityId: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

const HOLD_MS = 500;
const DBL_MS = 250;

export default class MultipleEntityRow extends LitElement {
  static styles = styles;

  static getConfigElement(): HTMLElement {
    return document.createElement('multiple-entity-row-editor');
  }

  @state() private _hass?: HASS;
  @state() private _config?: MultipleEntityRowConfig;
  @state() private _stateObj?: HassEntity;
  @state() private _info?: HassEntity;
  @state() private _entities: ResolvedEntity[] = [];

  private _entityIds: string[] = [];

  private _activeAction?: ActionBundle;
  private _holdTimer?: number;
  private _holdFired = false;
  private _clickTimer?: number;
  private _clickCount = 0;

  setConfig(config: MultipleEntityRowConfig): void {
    if (!config || !config.entity) {
      throw new Error('Please define a main entity.');
    }
    if (config.entities) {
      config.entities.forEach((e) => checkEntity(e));
    }
    if (config.secondary_info) {
      checkEntity(config.secondary_info);
    }

    this._entityIds = getEntityIds(config);
    this._config = {
      ...config,
      name: config.name === false ? ' ' : config.name,
    } as MultipleEntityRowConfig;
  }

  set hass(hass: HASS) {
    this._hass = hass;
    if (!this._config) return;

    this._stateObj = hass.states[this._config.entity];

    if (isObject(this._config.secondary_info)) {
      const infoId = (this._config.secondary_info as EntityConfig).entity;
      this._info = infoId ? hass.states[infoId] : this._stateObj;
    } else {
      this._info = undefined;
    }

    this._entities =
      this._config.entities
        ?.filter((cfg) => {
          // Skip empty in-progress objects coming back from the editor —
          // they're allowed by setConfig but shouldn't render anything.
          if (typeof cfg === 'string') return cfg.length > 0;
          return !!(cfg.entity || cfg.attribute || cfg.icon);
        })
        .map((cfg) => {
          const conf = typeof cfg === 'string' ? { entity: cfg } : cfg;
          return {
            ...conf,
            stateObj: conf.entity ? hass.states[conf.entity] : this._stateObj,
          };
        }) ?? [];
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
    if (this._clickTimer) {
      clearTimeout(this._clickTimer);
      this._clickTimer = undefined;
    }
    this._holdFired = false;
    this._clickCount = 0;
    this._activeAction = undefined;
  }

  // PR #373: hass.formatEntityName is initially a stub that ignores the
  // `name` override; the real formatter is swapped in asynchronously once
  // translations load. Re-render on that reference swap so the override
  // actually appears.
  shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) return true;

    const oldHass = changedProps.get('_hass') as HASS | undefined;
    if (!oldHass) return changedProps.has('_hass');

    if (oldHass.formatEntityName !== this._hass?.formatEntityName) return true;

    return this._entityIds.some((id) => oldHass.states[id] !== this._hass!.states[id]);
  }

  render(): TemplateResult | typeof nothing {
    if (!this._hass || !this._config) return nothing;
    if (!this._stateObj) return this._renderWarning();

    // Upstream #197: state_icon { state: 'mdi:...' } overrides the icon
    // for the main row too. We inject the resolved icon into the config
    // passed to <hui-generic-entity-row>, which handles HA's standard
    // icon-rendering pipeline.
    const stateIconOverride = this._resolveStateIcon(this._stateObj, this._config);
    const configForRow = stateIconOverride
      ? { ...this._config, icon: stateIconOverride }
      : this._config;

    // Upstream #325: icon_color via CSS variables — cascades from the host
    // <hui-generic-entity-row> down to its internal <state-badge>.
    const iconColorStyle = iconColorCss(this._config.icon_color);

    return html`<hui-generic-entity-row
      style=${iconColorStyle}
      .hass=${this._hass}
      .config=${configForRow}
      .secondaryText=${this._renderSecondaryInfo()}
      .catchInteraction=${false}
    >
      <div class=${this._config.column ? 'entities-column' : 'entities-row'}>
        ${this._entities.map((entity) => this._renderEntity(entity.stateObj, entity))}
        ${this._renderMainEntity()}
      </div>
    </hui-generic-entity-row>`;
  }

  private _resolveStateIcon(
    stateObj: HassEntity | undefined,
    config: EntityConfig,
  ): string | undefined {
    if (!stateObj || !isObject(config.state_icon)) return undefined;
    const map = config.state_icon as Record<string, string>;
    return map[stateObj.state];
  }

  private _renderSecondaryInfo(): TemplateResult | string | null {
    const si = this._config?.secondary_info;
    if (!si || hasGenericSecondaryInfo(si) || hideIf(this._info, si as EntityConfig, this._hass)) {
      return null;
    }
    if (typeof si === 'string') {
      return si;
    }
    const name = entityName(this._info, si);
    return html`${name} ${this._renderValue(this._info, si)}`;
  }

  private _renderMainEntity(): TemplateResult | null {
    if (!this._config || this._config.show_state === false) return null;
    // Upstream #227: honor top-level hide_if / hide_unavailable for the main
    // row state slot — same semantics as per-entity hideIf does for sub-rows.
    if (hideIf(this._stateObj, this._config, this._hass)) return null;

    const actions: ActionBundle = {
      entityId: this._config.entity,
      tap_action: this._config.tap_action,
      hold_action: this._config.hold_action,
      double_tap_action: this._config.double_tap_action,
    };

    return html`<div
      class="state entity"
      style=${entityStyles(this._config)}
      @pointerdown=${this._onPointerDown(actions)}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
      @click=${this._onClick(actions)}
    >
      ${this._config.state_header ? html`<span>${this._config.state_header}</span>` : nothing}
      <div>${this._renderValue(this._stateObj, this._config)}</div>
    </div>`;
  }

  private _renderEntity(
    stateObj: HassEntity | undefined,
    config: EntityConfig,
  ): TemplateResult | null {
    if (!stateObj || hideIf(stateObj, config, this._hass)) {
      if (config.default) {
        return html`<div class="entity" style=${entityStyles(config)}>
          <span>${config.name}</span>
          <div>${config.default}</div>
        </div>`;
      }
      return null;
    }

    const actions: ActionBundle = {
      entityId: stateObj.entity_id,
      tap_action: config.tap_action,
      hold_action: config.hold_action,
      double_tap_action: config.double_tap_action,
    };

    // Render the icon-slot when either `icon` is set (existing behavior)
    // or `state_icon` provides a state-specific glyph (#197).
    const useIconSlot = !!(config.icon || isObject(config.state_icon));

    return html`<div
      class="entity"
      style=${entityStyles(config)}
      @pointerdown=${this._onPointerDown(actions)}
      @pointerup=${this._onPointerUp}
      @pointercancel=${this._onPointerCancel}
      @click=${this._onClick(actions)}
    >
      <span>${entityName(stateObj, config)}</span>
      <div>${useIconSlot ? this._renderIcon(stateObj, config) : this._renderValue(stateObj, config)}</div>
    </div>`;
  }

  private _renderValue(
    stateObj: HassEntity | undefined,
    config: EntityConfig,
  ): TemplateResult | string {
    if (!stateObj || !this._hass) return '';

    if (config.toggle === true) {
      return html`<ha-entity-toggle
        .stateObj=${stateObj}
        .hass=${this._hass}
      ></ha-entity-toggle>`;
    }

    if (config.attribute && TIMESTAMP_ATTRIBUTES.includes(config.attribute)) {
      const dt = (stateObj as any)[config.attribute.replace('-', '_')];
      return html`<ha-relative-time
        .hass=${this._hass}
        .datetime=${dt}
        capitalize
      ></ha-relative-time>`;
    }

    if (config.format && TIMESTAMP_FORMATS.includes(config.format)) {
      const value = config.attribute
        ? (stateObj.attributes[config.attribute] ?? (stateObj as any)[config.attribute])
        : stateObj.state;
      const timestamp = new Date(value);
      if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
        return String(value);
      }
      return html`<hui-timestamp-display
        .hass=${this._hass}
        .ts=${timestamp}
        .format=${config.format}
        capitalize
      ></hui-timestamp-display>`;
    }

    return entityStateDisplay(this._hass, stateObj, config);
  }

  private _renderIcon(stateObj: HassEntity, config: EntityConfig): TemplateResult {
    // Resolution order: state_icon[stateObj.state] (#197) → config.icon
    // (or stateObj.attributes.icon when `icon: true`) → fall back to HA's
    // default by passing null.
    const stateIconOverride = this._resolveStateIcon(stateObj, config);
    const override =
      stateIconOverride ??
      (config.icon === true ? stateObj.attributes.icon || null : (config.icon as string | null));

    return html`<state-badge
      class="icon-small"
      style=${iconColorCss(config.icon_color)}
      .hass=${this._hass}
      .stateObj=${stateObj}
      .overrideIcon=${override}
      .stateColor=${config.state_color}
    ></state-badge>`;
  }

  private _renderWarning(): TemplateResult {
    return html`<hui-warning>
      ${this._hass!.localize(
        'ui.panel.lovelace.warning.entity_not_found',
        'entity',
        this._config!.entity,
      )}
    </hui-warning>`;
  }

  private _onPointerDown = (actions: ActionBundle) => (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    this._activeAction = actions;
    this._holdFired = false;
    if (this._holdTimer) clearTimeout(this._holdTimer);
    if (actions.hold_action) {
      this._holdTimer = window.setTimeout(() => {
        this._holdFired = true;
        this._holdTimer = undefined;
        this._runActiveAction('hold');
      }, HOLD_MS);
    }
  };

  private _onPointerUp = (): void => {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
  };

  private _onPointerCancel = (): void => {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = undefined;
    }
    this._holdFired = false;
    this._activeAction = undefined;
  };

  private _onClick = (actions: ActionBundle) => (e: MouseEvent) => {
    e.stopPropagation();
    if (this._holdFired) {
      this._holdFired = false;
      this._activeAction = undefined;
      return;
    }
    this._activeAction = actions;

    if (!actions.double_tap_action) {
      this._runActiveAction('tap');
      return;
    }

    this._clickCount += 1;
    if (this._clickCount === 1) {
      if (this._clickTimer) clearTimeout(this._clickTimer);
      this._clickTimer = window.setTimeout(() => {
        this._clickCount = 0;
        this._clickTimer = undefined;
        this._runActiveAction('tap');
      }, DBL_MS);
    } else {
      if (this._clickTimer) clearTimeout(this._clickTimer);
      this._clickTimer = undefined;
      this._clickCount = 0;
      this._runActiveAction('double_tap');
    }
  };

  private _runActiveAction(kind: 'tap' | 'hold' | 'double_tap'): void {
    const ctx = this._activeAction;
    if (!ctx || !this._hass) return;

    const cfg =
      kind === 'tap'
        ? (ctx.tap_action ?? { action: 'more-info' as const })
        : kind === 'hold'
          ? ctx.hold_action
          : ctx.double_tap_action;

    if (cfg) runAction(this, this._hass, ctx.entityId, cfg);
    this._activeAction = undefined;
  }
}
