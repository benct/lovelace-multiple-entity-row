// Visual config editor, adapted from the duczz/ha-multiple-entity-row fork's editor.ts
// (credit @duczz). Built on HA's native <ha-form> renderer with schemas in editor_schemas.ts.
//
// Written without Lit decorators: reactive properties are declared via static get properties()
// (matching the rest of this codebase), with `declare` class fields for typing only - a real
// class field would shadow Lit's generated accessors and silently break reactivity.

import { css, html, LitElement, nothing, TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import { SECONDARY_INFO_VALUES } from './lib/constants';
import { fireEvent, isObject } from './util';
import { ADDITIONAL_TAB_SCHEMA, LABELS, MAIN_TAB_SCHEMA } from './editor_schemas';
import { EntityConfig, HASS, MultipleEntityRowConfig } from './types';

type SecondaryMode = 'none' | 'text' | 'generic' | 'entity';

// Inlined @mdi/js path strings - not worth a dependency for five icons.
const PATH_PLUS = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
const PATH_DELETE = 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z';
const PATH_COPY =
    'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z';
const PATH_CUT =
    'M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z';
const PATH_PASTE =
    'M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z';
const PATH_MOVE_BEFORE = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
const PATH_MOVE_AFTER = 'M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z';

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
            select: { mode: 'dropdown', options: SECONDARY_INFO_VALUES.map((v: string) => ({ value: v, label: v })) },
        },
    },
];

const TEXT_SCHEMA = [{ name: 'text', selector: { text: { multiline: true } } }];

// Per-row schema for the state_icon row UI - a grid with a text input for the state name and an
// icon-selector for the icon. Routed via ha-form so it uses HA's standard form renderer.
const STATE_ICON_ROW_SCHEMA = [
    {
        type: 'grid',
        schema: [
            { name: 'state', selector: { text: {} } },
            { name: 'icon', selector: { icon: {} } },
        ],
    },
];

const STATE_ICON_ROW_LABEL = (item: { name: string }): string =>
    item.name === 'state' ? 'State' : item.name === 'icon' ? 'Icon' : item.name;

/** Object {color: 'red', ...} → YAML-style "color: red\n..." text for the code editor. */
const stringifyStyles = (styles: unknown): string => {
    if (!styles || typeof styles !== 'object' || Array.isArray(styles)) return '';
    return Object.entries(styles as Record<string, any>)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
};

/** Parse YAML-style "key: value" lines back into a styles object. Lax: ignores empty lines,
 * `#` comments, and malformed lines (they stay visible in the editor until fixed). */
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
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && value) result[key] = value;
    }
    return result;
};

/** `unit: false` (hide the unit) is a boolean in YAML but must round-trip through ha-form's text
 * selector - map it to/from the literal string 'false'. Side benefit: typing "false" into the
 * unit field sets the boolean form from the editor. */
const unitToForm = <T extends Record<string, any>>(config: T): T =>
    config.unit === false ? { ...config, unit: 'false' } : config;

const unitFromForm = <T extends Record<string, any>>(config: T): T =>
    config.unit === 'false' ? { ...config, unit: false } : config;

// Our own clipboard slot. Deliberately NOT HA's `dashboardCardClipboard` - that one holds
// Lovelace card configs and is consumed by <hui-card-picker>; pasting an entity sub-config
// there would surface garbage in HA's card picker.
const CLIPBOARD_KEY = 'multipleEntityRowClipboard';

// Subset of top-level config keys that semantically represent the "main entity slot" - used when
// copying Main into the clipboard so the pasted entry behaves naturally as an additional entity
// (no row-wide options like image / show_state / state_header / column).
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

type StateIconRows = [string, string][];

export class MultipleEntityRowEditor extends LitElement {
    declare hass?: HASS;
    declare _config?: MultipleEntityRowConfig;
    declare _selectedTab: number;
    declare _entitiesExpanded: boolean;
    declare _clipboardEntity?: EntityConfig;
    declare _stateIconRowsMain: StateIconRows;
    declare _stateIconRowsAdditional: Map<number, StateIconRows>;

    // Per-position stable keys for the entities tab list - lit needs these to swap tab contents
    // wholesale on reorder instead of mutating sibling tab contents in place.
    private _keys: Map<number, string> = new Map();

    static get properties() {
        return {
            // Reactive: HA re-assigns hass on every state tick; without this the entity pickers
            // inside ha-form would keep the hass they got on the last config change and go stale.
            hass: { attribute: false },
            _config: { state: true },
            // Tab 0 = Main (writes top-level config keys); 1+ = config.entities[tab - 1].
            _selectedTab: { state: true },
            _entitiesExpanded: { state: true },
            _clipboardEntity: { state: true },
            _stateIconRowsMain: { state: true },
            _stateIconRowsAdditional: { state: true },
        };
    }

    constructor() {
        super();
        this._selectedTab = 0;
        this._entitiesExpanded = true;
        this._stateIconRowsMain = [];
        this._stateIconRowsAdditional = new Map();
    }

    public setConfig(config: MultipleEntityRowConfig): void {
        this._config = config;
        const maxAdditionalTab = config.entities?.length ?? 0;
        if (this._selectedTab > maxAdditionalTab) {
            this._selectedTab = maxAdditionalTab;
        }
        this._clipboardEntity = this._readClipboard();

        // Sync state_icon row drafts with config. The match-skip preserves any empty rows the
        // user is mid-typing - without it, our own config-changed round-trips would wipe the
        // draft on every keystroke.
        if (!this._stateIconRowsMatch(this._stateIconRowsMain, config.state_icon)) {
            this._stateIconRowsMain = Object.entries(config.state_icon ?? {});
        }
        const next = new Map<number, StateIconRows>();
        config.entities?.forEach((e, i) => {
            const target = isObject(e) ? (e as EntityConfig).state_icon : undefined;
            const existing = this._stateIconRowsAdditional.get(i);
            if (existing && this._stateIconRowsMatch(existing, target)) {
                next.set(i, existing);
            } else if (target) {
                next.set(i, Object.entries(target));
            }
        });
        this._stateIconRowsAdditional = next;
    }

    /** True when the filtered form of `rows` (empty pairs dropped) structurally equals `target`.
     * Used to skip the setConfig sync when local drafts already match the config handed back. */
    private _stateIconRowsMatch(rows: StateIconRows, target: Record<string, string> | undefined): boolean {
        const filtered: Record<string, string> = {};
        for (const [k, v] of rows) {
            if (k.trim() && v.trim()) filtered[k.trim()] = v.trim();
        }
        const tgt = target ?? {};
        const keys = Object.keys(filtered);
        return keys.length === Object.keys(tgt).length && keys.every((k) => filtered[k] === tgt[k]);
    }

    private _readClipboard(): EntityConfig | undefined {
        try {
            const raw = sessionStorage.getItem(CLIPBOARD_KEY);
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed as EntityConfig;
        } catch {
            /* unavailable/invalid sessionStorage just disables paste */
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

    // ha-tab-group is a lazy-loaded HA chunk that may not be defined yet when the editor mounts;
    // a plain-button tab bar renders as fallback (see the HA lazy-loading gotcha).
    private get _hasNativeTabs(): boolean {
        return !!customElements.get('ha-tab-group') && !!customElements.get('ha-tab-group-tab');
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
        .state-icon-rows {
            margin-top: 4px;
        }
        .state-icon-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        .state-icon-row .state-icon-form {
            flex: 1;
            min-width: 0;
        }
        .state-icon-row ha-icon-button {
            flex: 0 0 auto;
        }
        .state-icon-add {
            margin-top: 4px;
            padding: 6px 14px;
            background: transparent;
            border: 1px dashed var(--divider-color, #e0e0e0);
            border-radius: 4px;
            color: var(--primary-color);
            cursor: pointer;
            font: inherit;
        }
        .state-icon-add:hover {
            background: var(--secondary-background-color);
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

            <div class="footer">v${process.env.PACKAGE_VERSION} · ${process.env.BUILD_TIME}</div>
        `;
    }

    private _onEntitiesExpandedChanged = (ev: CustomEvent): void => {
        const target = ev.target as { expanded?: boolean } | null;
        if (typeof target?.expanded === 'boolean') {
            this._entitiesExpanded = target.expanded;
        }
    };

    private _computeLabel = (item: { name: string }): string => LABELS[item.name] ?? item.name;

    // ── Entities panel: Main (tab 0) + Additional (tabs 1+) ─────────────

    private _keyFor(index: number): string {
        if (!this._keys.has(index)) {
            this._keys.set(index, `${index}-${Math.random().toString(36).slice(2, 10)}`);
        }
        return this._keys.get(index)!;
    }

    private _renderEntitiesPanel(): TemplateResult {
        const additional = this._config?.entities ?? [];
        // Clamp at render time too: a state mutation can trigger a render while _selectedTab
        // still points past the (just shrunk) entities list, before setConfig re-clamps it.
        const idx = Math.min(this._selectedTab, additional.length);

        return html`
            <div class="panel-content">
                <div class="tabs-row">
                    ${this._hasNativeTabs
                        ? html`
                              <ha-tab-group class="tabs" @wa-tab-show=${this._onTabShow}>
                                  <ha-tab-group-tab slot="nav" .panel=${0} .active=${idx === 0}>
                                      Main
                                  </ha-tab-group-tab>
                                  ${additional.map(
                                      (_e, i) => html`
                                          <ha-tab-group-tab slot="nav" .panel=${i + 1} .active=${idx === i + 1}>
                                              ${i + 1}
                                          </ha-tab-group-tab>
                                      `
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
                                      @click=${() => (this._selectedTab = 0)}
                                  >
                                      Main
                                  </button>
                                  ${additional.map(
                                      (_e, i) => html`
                                          <button
                                              type="button"
                                              class=${'tab ' + (idx === i + 1 ? 'tab--active' : '')}
                                              role="tab"
                                              aria-selected=${idx === i + 1 ? 'true' : 'false'}
                                              aria-controls="mer-tab-panel"
                                              @click=${() => (this._selectedTab = i + 1)}
                                          >
                                              ${i + 1}
                                          </button>
                                      `
                                  )}
                              </div>
                          `}
                    <ha-icon-button
                        class="tabs__add"
                        .label=${'Add entity'}
                        .path=${PATH_PLUS}
                        @click=${this._addEntity}
                    ></ha-icon-button>
                </div>

                <div id="mer-tab-panel" role="tabpanel">
                    ${keyed(this._keyFor(idx), idx === 0 ? this._renderMainTab() : this._renderAdditionalTab(idx - 1))}
                </div>
            </div>
        `;
    }

    private _renderMainTab(): TemplateResult {
        // Main has no Move / Cut / Delete (it's the anchor entity, required). Secondary info is
        // row-wide config, so it lives inside the Main tab rather than as a top-level panel.
        return html`
            <div class="child-actions">
                <ha-icon-button
                    .label=${'Copy main as template'}
                    .path=${PATH_COPY}
                    @click=${this._copyMainAsTemplate}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Paste as new entity'}
                    .path=${PATH_PASTE}
                    .disabled=${!this._clipboardEntity}
                    @click=${this._pasteEntity}
                ></ha-icon-button>
            </div>
            <div class="child-editor">
                <ha-form
                    .hass=${this.hass}
                    .data=${this._mainFormData()}
                    .schema=${MAIN_TAB_SCHEMA}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._mainValueChanged}
                ></ha-form>
                <div class="section-label">Secondary info</div>
                ${this._renderSecondaryInfoBlock()}
                <div class="section-label">State-based icons</div>
                ${this._renderStateIconRows('main')}
                <div class="section-label">Custom CSS</div>
                ${this._renderStylesBlock(this._config?.styles, (ev) => this._mainStylesChanged(ev))}
            </div>
        `;
    }

    private _renderStylesBlock(value: unknown, handler: (ev: CustomEvent) => void): TemplateResult {
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

    private _mainStylesChanged(ev: CustomEvent): void {
        if (!this._config) return;
        const parsed = parseStylesText((ev.detail as { value: string }).value);
        this._updateConfig({ styles: Object.keys(parsed).length > 0 ? parsed : undefined });
    }

    private _additionalStylesChanged(ev: CustomEvent, index: number): void {
        if (!this._config) return;
        const parsed = parseStylesText((ev.detail as { value: string }).value);
        const entities = [...(this._config.entities ?? [])];
        const raw = entities[index];
        const conf: EntityConfig = typeof raw === 'string' ? { entity: raw } : { ...raw };
        if (Object.keys(parsed).length > 0) {
            conf.styles = parsed;
        } else {
            delete conf.styles;
        }
        entities[index] = conf;
        this._updateConfig({ entities });
    }

    // ── State-icon row-based UI ─────────────────────────────────────────

    private _stateIconRowsFor(scope: 'main' | number): StateIconRows {
        return scope === 'main' ? this._stateIconRowsMain : this._stateIconRowsAdditional.get(scope) ?? [];
    }

    /** Persist updated rows to local state AND propagate the filtered object form to
     * config-changed. Empty rows (missing state or icon) stay in local state for editing but
     * don't reach the YAML config. */
    private _setStateIconRows(scope: 'main' | number, rows: StateIconRows): void {
        if (scope === 'main') {
            this._stateIconRowsMain = rows;
        } else {
            const next = new Map(this._stateIconRowsAdditional);
            next.set(scope, rows);
            this._stateIconRowsAdditional = next;
        }

        const filtered: Record<string, string> = {};
        for (const [k, v] of rows) {
            if (k.trim() && v.trim()) filtered[k.trim()] = v.trim();
        }
        const value = Object.keys(filtered).length > 0 ? filtered : undefined;

        if (!this._config) return;
        if (scope === 'main') {
            this._updateConfig({ state_icon: value });
        } else {
            const entities = [...(this._config.entities ?? [])];
            const raw = entities[scope];
            const conf: EntityConfig = typeof raw === 'string' ? { entity: raw } : { ...raw };
            if (value) {
                conf.state_icon = value;
            } else {
                delete conf.state_icon;
            }
            entities[scope] = conf;
            this._updateConfig({ entities });
        }
    }

    private _renderStateIconRows(scope: 'main' | number): TemplateResult {
        const rows = this._stateIconRowsFor(scope);

        return html`
            <div class="state-icon-rows">
                ${rows.map(
                    (entry, i) => html`
                        <div class="state-icon-row">
                            <ha-form
                                class="state-icon-form"
                                .hass=${this.hass}
                                .data=${{ state: entry[0], icon: entry[1] }}
                                .schema=${STATE_ICON_ROW_SCHEMA}
                                .computeLabel=${STATE_ICON_ROW_LABEL}
                                @value-changed=${(ev: CustomEvent) => {
                                    const v = ev.detail.value as { state?: string; icon?: string };
                                    const next = rows.map((e, j): [string, string] =>
                                        j === i ? [v.state ?? '', v.icon ?? ''] : e
                                    );
                                    this._setStateIconRows(scope, next);
                                }}
                            ></ha-form>
                            <ha-icon-button
                                .label=${'Remove'}
                                .path=${PATH_DELETE}
                                @click=${() =>
                                    this._setStateIconRows(
                                        scope,
                                        rows.filter((_, j) => j !== i)
                                    )}
                            ></ha-icon-button>
                        </div>
                    `
                )}
                <button
                    type="button"
                    class="state-icon-add"
                    @click=${() => this._setStateIconRows(scope, [...rows, ['', '']])}
                >
                    + Add state
                </button>
            </div>
        `;
    }

    private _renderAdditionalTab(additionalIndex: number): TemplateResult {
        const rawEntity = this._config!.entities![additionalIndex];
        const entityConfig: EntityConfig = typeof rawEntity === 'string' ? { entity: rawEntity } : rawEntity;
        const lastAdditional = (this._config?.entities?.length ?? 1) - 1;

        return html`
            <div class="child-actions">
                <ha-icon-button
                    .label=${'Move before'}
                    .path=${PATH_MOVE_BEFORE}
                    .disabled=${additionalIndex === 0}
                    @click=${() => this._moveAdditional(additionalIndex, -1)}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Move after'}
                    .path=${PATH_MOVE_AFTER}
                    .disabled=${additionalIndex === lastAdditional}
                    @click=${() => this._moveAdditional(additionalIndex, 1)}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Copy entity'}
                    .path=${PATH_COPY}
                    @click=${() => this._copyAdditional(additionalIndex)}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Cut entity'}
                    .path=${PATH_CUT}
                    @click=${() => this._cutAdditional(additionalIndex)}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Paste from clipboard'}
                    .path=${PATH_PASTE}
                    .disabled=${!this._clipboardEntity}
                    @click=${this._pasteEntity}
                ></ha-icon-button>
                <ha-icon-button
                    .label=${'Delete entity'}
                    .path=${PATH_DELETE}
                    @click=${() => this._deleteAdditional(additionalIndex)}
                ></ha-icon-button>
            </div>
            <div class="child-editor">
                <ha-form
                    .hass=${this.hass}
                    .data=${unitToForm(entityConfig)}
                    .schema=${ADDITIONAL_TAB_SCHEMA}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${(ev: CustomEvent) => this._additionalValueChanged(ev, additionalIndex)}
                ></ha-form>
                <div class="section-label">State-based icons</div>
                ${this._renderStateIconRows(additionalIndex)}
                <div class="section-label">Custom CSS</div>
                ${this._renderStylesBlock(entityConfig.styles, (ev: CustomEvent) =>
                    this._additionalStylesChanged(ev, additionalIndex)
                )}
            </div>
        `;
    }

    // Native <ha-tab-group> tab-show: the tab's `panel` value is the tab index.
    private _onTabShow = (ev: CustomEvent): void => {
        const name = (ev.detail as { name?: string })?.name;
        if (name == null) return;
        const idx = parseInt(name, 10);
        if (!Number.isNaN(idx) && idx !== this._selectedTab) {
            this._selectedTab = idx;
        }
    };

    // ── Value-changed handlers ──────────────────────────────────────────

    /** Form data for the Main tab: seeds show_state's runtime default (ON) so the toggle reads
     * correctly for configs that don't set the key, and maps `unit: false` to its text form. */
    private _mainFormData(): MultipleEntityRowConfig {
        return unitToForm({ show_state: true, ...this._config! });
    }

    private _mainValueChanged = (ev: CustomEvent): void => {
        if (!this._config) return;
        const newConfig = unitFromForm({ ...(ev.detail.value as MultipleEntityRowConfig) });
        // show_state: true is the seeded runtime default - strip the redundant key on the way
        // back out so it doesn't pollute the YAML.
        if (newConfig.show_state === true) delete newConfig.show_state;
        fireEvent(this, 'config-changed', { config: newConfig });
    };

    private _additionalValueChanged = (ev: CustomEvent, additionalIndex: number): void => {
        if (!this._config) return;
        const entities = [...(this._config.entities ?? [])];
        entities[additionalIndex] = unitFromForm(ev.detail.value as EntityConfig);
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
        [entities[additionalIndex], entities[target]] = [entities[target], entities[additionalIndex]];
        this._selectedTab = target + 1; // tab index = additional index + 1
        this._keys.clear();
        this._updateConfig({ entities });
    };

    private _copyAdditional = (additionalIndex: number): void => {
        const raw = this._config?.entities?.[additionalIndex];
        if (raw == null) return;
        this._writeClipboard(typeof raw === 'string' ? { entity: raw } : { ...raw });
    };

    private _cutAdditional = (additionalIndex: number): void => {
        this._copyAdditional(additionalIndex);
        this._deleteAdditional(additionalIndex);
    };

    /** Copy Main's per-entity-relevant fields as a clipboard template - useful to seed similar
     * additional entities. Row-wide fields (column, image, show_state, state_header) are
     * intentionally NOT copied since they don't apply to a sub-entity slot. */
    private _copyMainAsTemplate = (): void => {
        if (!this._config) return;
        const tmpl: EntityConfig = {};
        for (const k of MAIN_COPYABLE_FIELDS) {
            const v = this._config[k];
            if (v !== undefined) (tmpl as Record<string, any>)[k] = v;
        }
        this._writeClipboard(tmpl);
    };

    private _pasteEntity = (): void => {
        if (!this._config) return;
        const fresh = this._readClipboard();
        if (!fresh) return;
        const entities = [...(this._config.entities ?? []), fresh];
        this._selectedTab = entities.length;
        this._keys.clear();
        this._updateConfig({ entities });
    };

    // ── Secondary info (polymorphic: text | generic token | entity object) ─

    private _secondaryInfoMode(): SecondaryMode {
        const si = this._config?.secondary_info;
        if (si == null) return 'none';
        if (typeof si === 'object') return 'entity';
        if (SECONDARY_INFO_VALUES.includes(si)) return 'generic';
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
                              .data=${unitToForm(si as EntityConfig)}
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
        this._updateConfig({ secondary_info: unitFromForm(ev.detail.value as EntityConfig) });
    };

    // ── Helpers ─────────────────────────────────────────────────────────

    private _updateConfig(patch: Partial<MultipleEntityRowConfig>): void {
        if (!this._config) return;
        const next: Record<string, any> = { ...this._config };
        for (const [k, v] of Object.entries(patch)) {
            if (v === undefined) delete next[k];
            else next[k] = v;
        }
        fireEvent(this, 'config-changed', { config: next });
    }
}

customElements.define('multiple-entity-row-editor', MultipleEntityRowEditor);
