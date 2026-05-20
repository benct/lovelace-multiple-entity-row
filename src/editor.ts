import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import {
  mdiContentCopy,
  mdiContentCut,
  mdiContentPaste,
  mdiDelete,
  mdiPlus,
} from '@mdi/js';

import { version } from '../package.json';
import fireEvent from './fireEvent';
import { SECONDARY_INFO_VALUES } from './helpers';
import {
  ADDITIONAL_TAB_SCHEMA,
  INTERACTIONS_SCHEMA,
  LABELS,
  MAIN_TAB_SCHEMA,
} from './schemas';
import type { EntityConfig, HASS, MultipleEntityRowConfig } from './types';

type SecondaryMode = 'none' | 'text' | 'generic' | 'entity';

const SECONDARY_MODE_SCHEMA = [
  {
    name: 'mode',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'none', label: 'None' },
          { value: 'text', label: 'Custom text' },
          { value: 'generic', label: 'HA built-in token' },
          { value: 'entity', label: 'Entity-based' },
        ],
      },
    },
  },
];

const GENERIC_TOKEN_SCHEMA = [
  {
    name: 'token',
    selector: {
      select: {
        mode: 'dropdown',
        options: SECONDARY_INFO_VALUES.map((v) => ({ value: v, label: v })),
      },
    },
  },
];

const TEXT_SCHEMA = [{ name: 'text', selector: { text: { multiline: true } } }];

/** Object {color: 'red', ...} → YAML-style text "color: red\n..." for the
 * code editor. Returns empty string when there are no styles. */
const stringifyStyles = (styles: unknown): string => {
  if (!styles || typeof styles !== 'object' || Array.isArray(styles)) return '';
  return Object.entries(styles as Record<string, any>)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
};

/** Parse YAML-style "key: value" lines back into a styles Object. Lax:
 * ignores empty lines, `#` comments, and malformed lines. */
const parseStylesText = (text: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!text) return result;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value) result[key] = value;
  }
  return result;
};

// Our own clipboard slot. We intentionally do NOT use HA's
// `dashboardCardClipboard` — that one holds Lovelace card configs and is
// consumed by `<hui-card-picker>`. Pasting an entity sub-config there
// would surface garbage in HA's card picker.
const CLIPBOARD_KEY = 'multipleEntityRowClipboard';

// Subset of top-level config keys that semantically represent the "main
// entity slot" — used when copying Main into the clipboard so the pasted
// entry behaves naturally as an additional entity (no row-wide options
// like image / show_state / state_header / column).
const MAIN_COPYABLE_FIELDS: (keyof MultipleEntityRowConfig)[] = [
  'entity',
  'name',
  'attribute',
  'unit',
  'icon',
  'icon_color',
  'state_icon',
  'state_color',
  'toggle',
  'hide_unavailable',
  'format',
  'tap_action',
  'styles',
];

export default class MultipleEntityRowEditor extends LitElement {
  @state() private _config?: MultipleEntityRowConfig;
  // idx 0 → Main tab (writes to top-level config keys)
  // idx 1+ → Additional entity at config.entities[idx - 1]
  @state() private _selectedTab = 0;
  // Entities panel is the entry point — open by default. Tracked as
  // local state so user toggling doesn't fight the template re-render.
  @state() private _entitiesExpanded = true;
  public hass?: HASS;

  // Per-position stable keys for the entities tab list — lit-html needs
  // these to move DOM nodes on reorder instead of mutating sibling tab
  // contents (stale-config bug, ha-stack-in-card gotchas #3).
  private _keys: Map<number, string> = new Map();

  @state() private _clipboardEntity?: EntityConfig;

  public setConfig(config: MultipleEntityRowConfig): void {
    this._config = config;
    const maxAdditionalTab = config.entities?.length ?? 0;
    if (this._selectedTab > maxAdditionalTab) {
      this._selectedTab = maxAdditionalTab;
    }
    this._clipboardEntity = this._readClipboard();
  }

  private _readClipboard(): EntityConfig | undefined {
    try {
      const raw = sessionStorage.getItem(CLIPBOARD_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as EntityConfig;
    } catch {
      /* ignore */
    }
    return undefined;
  }

  private _writeClipboard(entity: EntityConfig): void {
    try {
      sessionStorage.setItem(CLIPBOARD_KEY, JSON.stringify(entity));
      this._clipboardEntity = entity;
    } catch {
      /* ignore */
    }
  }

  private get _hasNativeTabs(): boolean {
    return (
      !!customElements.get('ha-tab-group') && !!customElements.get('ha-tab-group-tab')
    );
  }

  static styles = css`
    ha-expansion-panel {
      display: block;
      margin-top: 12px;
    }
    .panel-content {
      padding: 12px 0;
    }
    .tabs-row {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      margin-bottom: 8px;
    }
    ha-tab-group.tabs {
      flex: 1;
      min-width: 0;
    }
    .tab-bar--fallback {
      display: flex;
      flex: 1;
      gap: 4px;
      overflow-x: auto;
    }
    .tab-bar--fallback .tab {
      padding: 8px 12px;
      cursor: pointer;
      border: 1px solid transparent;
      border-bottom: none;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      white-space: nowrap;
      color: var(--secondary-text-color);
      background: transparent;
      font: inherit;
    }
    .tab-bar--fallback .tab--active {
      background: var(--card-background-color);
      border-color: var(--divider-color);
      color: var(--primary-text-color);
    }
    .tabs__add {
      flex: 0 0 auto;
    }
    .child-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0 8px;
    }
    .child-actions ha-icon-button[disabled] {
      opacity: 0.4;
      pointer-events: none;
    }
    .child-editor {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
      background: var(--card-background-color);
    }
    .secondary-sub-form {
      margin-top: 8px;
    }
    .section-label {
      margin-top: 16px;
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      font-size: 11px;
      color: var(--secondary-text-color);
      text-align: right;
    }
  `;

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;

    return html`
      <ha-expansion-panel
        .header=${'Entities'}
        outlined
        ?expanded=${this._entitiesExpanded}
        @expanded-changed=${this._onEntitiesExpandedChanged}
      >
        ${this._renderEntitiesPanel()}
      </ha-expansion-panel>

      <ha-expansion-panel .header=${'Interactions'} outlined>
        <div class="panel-content">
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${INTERACTIONS_SCHEMA}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._mainValueChanged}
          ></ha-form>
        </div>
      </ha-expansion-panel>

      <div class="footer">v${version} · ${process.env.BUILD_TIME}</div>
    `;
  }

  private _onEntitiesExpandedChanged = (ev: CustomEvent): void => {
    const target = ev.target as any;
    if (typeof target?.expanded === 'boolean') {
      this._entitiesExpanded = target.expanded;
    }
  };

  private _computeLabel = (item: { name: string }): string =>
    LABELS[item.name] ?? item.name;

  // ── Entities panel: Main (tab 0) + Additional (tabs 1+) ─────────────

  private _keyFor(index: number): string {
    if (!this._keys.has(index)) {
      this._keys.set(index, `${index}-${Math.random().toString(36).slice(2, 10)}`);
    }
    return this._keys.get(index)!;
  }

  private _renderEntitiesPanel(): TemplateResult {
    const additional = this._config?.entities ?? [];
    const idx = this._selectedTab;
    // Tab count = 1 (Main) + additional.length
    const totalTabs = 1 + additional.length;

    return html`
      <div class="panel-content">
        <div class="tabs-row">
          ${this._hasNativeTabs
            ? html`
                <ha-tab-group class="tabs" @wa-tab-show=${this._onTabShow}>
                  <ha-tab-group-tab slot="nav" .panel=${0} .active=${idx === 0}>
                    1
                  </ha-tab-group-tab>
                  ${additional.map(
                    (_e, i) => html`
                      <ha-tab-group-tab
                        slot="nav"
                        .panel=${i + 1}
                        .active=${idx === i + 1}
                      >
                        ${i + 2}
                      </ha-tab-group-tab>
                    `,
                  )}
                </ha-tab-group>
              `
            : html`
                <div class="tab-bar--fallback" role="tablist">
                  <button
                    type="button"
                    class=${'tab ' + (idx === 0 ? 'tab--active' : '')}
                    role="tab"
                    aria-selected=${idx === 0 ? 'true' : 'false'}
                    aria-controls="mer-tab-panel"
                    @click=${() => this._selectTab(0)}
                  >
                    1
                  </button>
                  ${additional.map(
                    (_e, i) => html`
                      <button
                        type="button"
                        class=${'tab ' + (idx === i + 1 ? 'tab--active' : '')}
                        role="tab"
                        aria-selected=${idx === i + 1 ? 'true' : 'false'}
                        aria-controls="mer-tab-panel"
                        @click=${() => this._selectTab(i + 1)}
                      >
                        ${i + 2}
                      </button>
                    `,
                  )}
                </div>
              `}
          <ha-icon-button
            class="tabs__add"
            .label=${'Add entity'}
            .path=${mdiPlus}
            @click=${this._addEntity}
          ></ha-icon-button>
        </div>

        <div id="mer-tab-panel" role="tabpanel">
          ${keyed(
            this._keyFor(idx),
            idx === 0 ? this._renderMainTab() : this._renderAdditionalTab(idx - 1, totalTabs),
          )}
        </div>
      </div>
    `;
  }

  private _renderMainTab(): TemplateResult {
    // Main has no Move / Cut / Delete (it's the anchor entity, required).
    // Secondary info is row-wide config, so it lives inside the Main tab
    // rather than as a separate top-level panel.
    return html`
      <div class="child-actions">
        <ha-icon-button
          .label=${'Copy main as template'}
          .path=${mdiContentCopy}
          @click=${this._copyMainAsTemplate}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Paste as new entity'}
          .path=${mdiContentPaste}
          .disabled=${!this._clipboardEntity}
          @click=${this._pasteEntity}
        ></ha-icon-button>
      </div>
      <div class="child-editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${MAIN_TAB_SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._mainValueChanged}
        ></ha-form>
        <div class="section-label">Secondary info</div>
        ${this._renderSecondaryInfoBlock()}
        <div class="section-label">State-based icons</div>
        ${this._renderKeyMapBlock(
          this._config?.state_icon,
          (ev) => this._mainKeyMapChanged(ev, 'state_icon'),
        )}
        <div class="section-label">Custom CSS</div>
        ${this._renderKeyMapBlock(
          this._config?.styles,
          (ev) => this._mainKeyMapChanged(ev, 'styles'),
        )}
      </div>
    `;
  }

  private _renderKeyMapBlock(
    value: unknown,
    handler: (ev: CustomEvent) => void,
  ): TemplateResult {
    // autocomplete-icons enables mdi:* suggestions (essential for the
    // state_icon block); autocomplete-entities is included for parity with
    // stack-in-card's pattern — both attributes are harmless when not
    // triggered (e.g. inside the styles block where neither applies).
    return html`
      <ha-code-editor
        mode="yaml"
        autocomplete-entities
        autocomplete-icons
        .hass=${this.hass}
        .value=${stringifyStyles(value)}
        @value-changed=${handler}
      ></ha-code-editor>
    `;
  }

  /** Generic key:value-map mutator for top-level Main fields (currently
   * `styles` and `state_icon`). Empty maps are stripped from the config. */
  private _mainKeyMapChanged = (
    ev: CustomEvent,
    field: 'styles' | 'state_icon',
  ): void => {
    if (!this._config) return;
    const parsed = parseStylesText((ev.detail as any).value as string);
    const next: any = { ...this._config };
    if (Object.keys(parsed).length > 0) {
      next[field] = parsed;
    } else {
      delete next[field];
    }
    fireEvent(this, 'config-changed', { config: next });
  };

  /** Generic key:value-map mutator for an additional-entity's field. */
  private _additionalKeyMapChanged = (
    ev: CustomEvent,
    index: number,
    field: 'styles' | 'state_icon',
  ): void => {
    if (!this._config) return;
    const parsed = parseStylesText((ev.detail as any).value as string);
    const entities = [...(this._config.entities ?? [])];
    const raw = entities[index];
    const conf: any = typeof raw === 'string' ? { entity: raw } : { ...raw };
    if (Object.keys(parsed).length > 0) {
      conf[field] = parsed;
    } else {
      delete conf[field];
    }
    entities[index] = conf;
    this._updateConfig({ entities });
  };

  private _renderAdditionalTab(
    additionalIndex: number,
    _totalTabs: number,
  ): TemplateResult {
    const rawEntity = this._config!.entities![additionalIndex];
    const entityConfig =
      typeof rawEntity === 'string' ? { entity: rawEntity } : rawEntity;
    const lastAdditional = (this._config?.entities?.length ?? 1) - 1;
    const atFirst = additionalIndex === 0;
    const atLast = additionalIndex === lastAdditional;

    return html`
      <div class="child-actions">
        <ha-icon-button
          .label=${'Move before'}
          .path=${'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z'}
          .disabled=${atFirst}
          @click=${() => this._moveAdditional(additionalIndex, -1)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Move after'}
          .path=${'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z'}
          .disabled=${atLast}
          @click=${() => this._moveAdditional(additionalIndex, 1)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Copy entity'}
          .path=${mdiContentCopy}
          @click=${() => this._copyAdditional(additionalIndex)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Cut entity'}
          .path=${mdiContentCut}
          @click=${() => this._cutAdditional(additionalIndex)}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Paste from clipboard'}
          .path=${mdiContentPaste}
          .disabled=${!this._clipboardEntity}
          @click=${this._pasteEntity}
        ></ha-icon-button>
        <ha-icon-button
          .label=${'Delete entity'}
          .path=${mdiDelete}
          @click=${() => this._deleteAdditional(additionalIndex)}
        ></ha-icon-button>
      </div>
      <div class="child-editor">
        <ha-form
          .hass=${this.hass}
          .data=${entityConfig}
          .schema=${ADDITIONAL_TAB_SCHEMA}
          .computeLabel=${this._computeLabel}
          @value-changed=${(ev: CustomEvent) =>
            this._additionalValueChanged(ev, additionalIndex)}
        ></ha-form>
        <div class="section-label">State-based icons</div>
        ${this._renderKeyMapBlock(
          (entityConfig as any).state_icon,
          (ev: CustomEvent) => this._additionalKeyMapChanged(ev, additionalIndex, 'state_icon'),
        )}
        <div class="section-label">Custom CSS</div>
        ${this._renderKeyMapBlock(
          (entityConfig as any).styles,
          (ev: CustomEvent) => this._additionalKeyMapChanged(ev, additionalIndex, 'styles'),
        )}
      </div>
    `;
  }

  // Native <ha-tab-group> tab-show: tab's `name` attribute is the tab index.
  private _onTabShow = (ev: CustomEvent): void => {
    const name = (ev.detail as any)?.name;
    if (name == null) return;
    const idx = parseInt(name, 10);
    if (!Number.isNaN(idx) && idx !== this._selectedTab) {
      this._selectedTab = idx;
    }
  };

  private _selectTab = (i: number): void => {
    this._selectedTab = i;
  };

  // ── Value-changed handlers ──────────────────────────────────────────

  private _mainValueChanged = (ev: CustomEvent): void => {
    if (!this._config) return;
    const newConfig = ev.detail.value as MultipleEntityRowConfig;
    fireEvent(this, 'config-changed', { config: newConfig });
  };

  private _additionalValueChanged = (ev: CustomEvent, additionalIndex: number): void => {
    if (!this._config) return;
    const newEntity = ev.detail.value as EntityConfig;
    const entities = [...(this._config.entities ?? [])];
    entities[additionalIndex] = newEntity;
    this._updateConfig({ entities });
  };

  // ── Mutating handlers (Main is protected) ───────────────────────────

  private _addEntity = (): void => {
    if (!this._config) return;
    const entities = [...(this._config.entities ?? []), {} as EntityConfig];
    this._selectedTab = entities.length; // last additional tab
    this._keys.clear();
    this._updateConfig({ entities });
  };

  private _deleteAdditional = (additionalIndex: number): void => {
    if (!this._config) return;
    const entities = [...(this._config.entities ?? [])];
    entities.splice(additionalIndex, 1);
    // If we deleted the currently-selected tab, fall back to last additional or Main.
    if (this._selectedTab > entities.length) {
      this._selectedTab = entities.length;
    }
    this._keys.clear();
    this._updateConfig({ entities: entities.length ? entities : undefined });
  };

  private _moveAdditional = (additionalIndex: number, delta: number): void => {
    if (!this._config) return;
    const entities = [...(this._config.entities ?? [])];
    const target = additionalIndex + delta;
    if (target < 0 || target >= entities.length) return;
    [entities[additionalIndex], entities[target]] = [
      entities[target],
      entities[additionalIndex],
    ];
    this._selectedTab = target + 1; // tab index = additional + 1
    this._keys.clear();
    this._updateConfig({ entities });
  };

  private _copyAdditional = (additionalIndex: number): void => {
    const raw = this._config?.entities?.[additionalIndex];
    if (raw == null) return;
    const e: EntityConfig = typeof raw === 'string' ? { entity: raw } : { ...raw };
    this._writeClipboard(e);
  };

  private _cutAdditional = (additionalIndex: number): void => {
    this._copyAdditional(additionalIndex);
    this._deleteAdditional(additionalIndex);
  };

  /**
   * Copy Main's identifying fields as an EntityConfig template into the
   * clipboard. Used to spawn a similar additional entity from the Main
   * setup as a starting point. Row-wide fields (column, image,
   * show_state, state_header) are intentionally NOT copied — they don't
   * apply to a sub-entity slot.
   */
  private _copyMainAsTemplate = (): void => {
    if (!this._config) return;
    const tmpl: any = {};
    for (const k of MAIN_COPYABLE_FIELDS) {
      const v = (this._config as any)[k];
      if (v !== undefined) tmpl[k] = v;
    }
    this._writeClipboard(tmpl as EntityConfig);
  };

  private _pasteEntity = (): void => {
    if (!this._config) return;
    const fresh = this._readClipboard();
    if (!fresh) return;
    const entities = [...(this._config.entities ?? []), fresh];
    this._selectedTab = entities.length; // last additional tab
    this._keys.clear();
    this._updateConfig({ entities });
  };

  // ── Secondary info (polymorphic: text | generic token | entity object) ─

  private _secondaryInfoMode(): SecondaryMode {
    const si = this._config?.secondary_info;
    if (si == null) return 'none';
    if (typeof si === 'object') return 'entity';
    if (typeof si === 'string' && SECONDARY_INFO_VALUES.includes(si)) return 'generic';
    return 'text';
  }

  private _renderSecondaryInfoBlock(): TemplateResult {
    const mode = this._secondaryInfoMode();
    const si = this._config?.secondary_info;

    return html`
      <div>
        <ha-form
          .hass=${this.hass}
          .data=${{ mode }}
          .schema=${SECONDARY_MODE_SCHEMA}
          .computeLabel=${() => 'Mode'}
          @value-changed=${this._secondaryModeChanged}
        ></ha-form>
        ${mode === 'text'
          ? html`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${{ text: si ?? '' }}
                .schema=${TEXT_SCHEMA}
                .computeLabel=${() => 'Custom text'}
                @value-changed=${this._secondaryTextChanged}
              ></ha-form>
            </div>`
          : nothing}
        ${mode === 'generic'
          ? html`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${{ token: si }}
                .schema=${GENERIC_TOKEN_SCHEMA}
                .computeLabel=${() => 'HA built-in'}
                @value-changed=${this._secondaryTokenChanged}
              ></ha-form>
            </div>`
          : nothing}
        ${mode === 'entity'
          ? html`<div class="secondary-sub-form">
              <ha-form
                .hass=${this.hass}
                .data=${si as EntityConfig}
                .schema=${ADDITIONAL_TAB_SCHEMA}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._secondaryEntityChanged}
              ></ha-form>
            </div>`
          : nothing}
      </div>
    `;
  }

  private _secondaryModeChanged = (ev: CustomEvent): void => {
    if (!this._config) return;
    const newMode = ev.detail.value.mode as SecondaryMode;
    if (newMode === this._secondaryInfoMode()) return;
    let nextSi: MultipleEntityRowConfig['secondary_info'] | undefined;
    switch (newMode) {
      case 'none':
        nextSi = undefined;
        break;
      case 'text':
        nextSi = '';
        break;
      case 'generic':
        nextSi = 'last-changed';
        break;
      case 'entity':
        nextSi = { entity: this._config.entity };
        break;
    }
    this._updateConfig({ secondary_info: nextSi });
  };

  private _secondaryTextChanged = (ev: CustomEvent): void => {
    this._updateConfig({ secondary_info: ev.detail.value.text });
  };

  private _secondaryTokenChanged = (ev: CustomEvent): void => {
    this._updateConfig({ secondary_info: ev.detail.value.token });
  };

  private _secondaryEntityChanged = (ev: CustomEvent): void => {
    this._updateConfig({ secondary_info: ev.detail.value as EntityConfig });
  };

  // ── Helpers ─────────────────────────────────────────────────────────

  private _updateConfig(patch: Partial<MultipleEntityRowConfig>): void {
    if (!this._config) return;
    const next: any = { ...this._config };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete next[k];
      else next[k] = v;
    }
    fireEvent(this, 'config-changed', { config: next });
  }
}
