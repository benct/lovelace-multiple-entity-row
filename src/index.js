import { css, html, LitElement } from 'lit';

import { LAST_CHANGED, LAST_UPDATED, TIMESTAMP_FORMATS } from './lib/constants';
import { createGestureHandlers } from './lib/gesture_handler';
import { checkEntity, entityName, entityStateDisplay, entityStyles, iconColorCss, stateIcon } from './entity';
import { fireEvent, getEntityIds, hasConfigOrEntitiesChanged, hasGenericSecondaryInfo, hideIf, isObject } from './util';
import { hasTemplate, resolveTemplateFields, templateDisplay, TemplateSubscriptions } from './templates';
import { style } from './styles';
import './editor';

// hui-generic-entity-row attaches its own tap/hold/double-tap detection to the outer row
// element unconditionally (see the catchInteraction comment in render() below) via mousedown/
// click/touchstart/touchend/touchcancel/contextmenu listeners - a disjoint event set from the
// pointerdown/pointerup/pointercancel we use for our own per-entity detection, so stopPropagation
// on our own pointer events doesn't touch it. Stopping propagation of that exact event set at each
// entity's own element keeps it from ever reaching the row's listener, so only our per-entity
// dispatch fires (see #338, #202, #188, #251).
const stopBubble = (event) => event.stopPropagation();

console.info(
    `%c MULTIPLE-ENTITY-ROW %c ${process.env.PACKAGE_VERSION} (built ${process.env.BUILD_TIME}, ${process.env.BUILD_COMMIT}) `,
    'color: cyan; background: black; font-weight: bold;',
    'color: darkblue; background: white; font-weight: bold;'
);

class MultipleEntityRow extends LitElement {
    static getConfigElement() {
        return document.createElement('multiple-entity-row-editor');
    }

    static getStubConfig(hass, entities) {
        // Prefer a sensor for the stub so the row shows a value out of the box.
        const entity = entities?.find((e) => e.startsWith('sensor.')) ?? entities?.[0] ?? '';
        return { entity };
    }

    static get properties() {
        return {
            _hass: Object,
            config: Object,
            stateObj: Object,
            _templateResults: Object,
        };
    }

    constructor() {
        super();
        this._templateResults = new Map();
        this._templates = new TemplateSubscriptions((results) => {
            this._templateResults = results;
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this._templates.connect();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._templates.disconnect();
    }

    setConfig(config) {
        if (!config || !config.entity) {
            throw new Error('Please define a main entity.');
        }
        if (config.entities) {
            config.entities.forEach((entity) => checkEntity(entity));
        }
        if (config.secondary_info) {
            checkEntity(config.secondary_info);
        }

        this.entityIds = getEntityIds(config);
        // Cached tap/hold/double-tap gesture state per rendered entity (see getGestureHandlers) -
        // reset whenever config changes, since a config change can add/remove/reorder entities or
        // their action configs.
        this._actionHandlers = new Map();

        // HA 2026.7+'s entities-card row editor silently renames a row's `format` key to
        // `time_format` on save, even for a custom row type with entirely different `format`
        // semantics (see #386). That migration only touches the top-level row config, not our
        // own nested `entities`/`secondary_info` config, so this fallback only needs to happen
        // here. Prefer `format` if somehow both are present (e.g. a value hand-edited back in).
        this.config = {
            ...config,
            name: config.name === false ? ' ' : config.name,
            format: config.format ?? config.time_format,
        };
        this._templates.setConfig(this.config);
    }

    shouldUpdate(changedProps) {
        return hasConfigOrEntitiesChanged(this, changedProps);
    }

    set hass(hass) {
        this._hass = hass;
        this._templates.setHass(hass);

        if (hass && this.config) {
            this.stateObj = hass.states[this.config.entity];

            if (isObject(this.config.secondary_info)) {
                this.info = hass.states[this.config.secondary_info.entity] ?? this.stateObj;
            }

            this.entities =
                this.config.entities?.map((config) => {
                    const conf = typeof config === 'string' ? { entity: config } : config;
                    return { ...conf, stateObj: conf.entity ? hass.states[conf.entity] : this.stateObj };
                }) ?? [];
        }
    }

    static get styles() {
        return style(css);
    }

    // A copy of `config` (row-level, sub-entity or secondary_info object) with any templated
    // fields swapped for their current subscription results - identity when nothing is
    // templated. Resolution happens here at render time, so downstream display logic only ever
    // sees plain values.
    _resolved(config) {
        return resolveTemplateFields(config, this._templateResults, config.entity ?? this.config.entity);
    }

    render() {
        if (!this._hass || !this.config) return html``;
        if (!this.stateObj) return this.renderWarning();

        const config = this._resolved(this.config);
        // A state_icon match overrides the main row's icon by injecting it into the config
        // handed to hui-generic-entity-row, which owns the main icon rendering (see #197).
        const mainStateIcon = stateIcon(this.stateObj, config);
        const rowConfig = mainStateIcon ? { ...config, icon: mainStateIcon } : config;

        // catchInteraction: true tells hui-generic-entity-row not to attach its own tap/hold/
        // double-tap gesture detection to our slotted content. That detection is otherwise bound
        // to the whole slot and dispatches using only the row-level config (this.config), with no
        // awareness of which of our own rendered entities was actually interacted with - every
        // sub-entity click also double-fired the main entity's own action config. Each of our
        // entities gets its own tap/hold/double-tap handling in renderMainEntity/renderEntity
        // instead, correctly scoped to its own action config (see #338, #202).
        return html`<hui-generic-entity-row
            style="${iconColorCss(config.icon_color)}"
            .hass="${this._hass}"
            .config="${rowConfig}"
            .secondaryText="${this.renderSecondaryInfo()}"
            .catchInteraction=${true}
        >
            <div class="${this.config.column ? 'entities-column' : 'entities-row'}">
                ${this.config.show_state_first
                    ? html`${this.renderMainEntity()}${this.entities.map((entity, index) =>
                          this.renderEntity(entity.stateObj, entity, index)
                      )}`
                    : html`${this.entities.map((entity, index) =>
                          this.renderEntity(entity.stateObj, entity, index)
                      )}${this.renderMainEntity()}`}
            </div>
        </hui-generic-entity-row>`;
    }

    renderSecondaryInfo() {
        const secondaryInfo = this.config.secondary_info;
        if (!secondaryInfo || hasGenericSecondaryInfo(secondaryInfo)) {
            return null;
        }
        if (typeof secondaryInfo === 'string') {
            return html`${hasTemplate(secondaryInfo)
                ? templateDisplay(this._templateResults, secondaryInfo, this.config.entity)
                : secondaryInfo}`;
        }
        const config = this._resolved(secondaryInfo);
        if (hideIf(this.info, config, this._hass)) {
            return null;
        }
        const name = entityName(this.info, config);
        return html`${name} ${this.renderValue(this.info, config)}`;
    }

    renderMainEntity() {
        if (this.config.show_state === false) {
            return null;
        }
        const config = this._resolved(this.config);
        // Top-level hide_if/hide_unavailable hide the main state slot, symmetrical to per-entity
        // behavior - previously they were silently ignored on the main entity (see #227). The row
        // itself (name, icon, sub-entities) stays visible.
        if (hideIf(this.stateObj, config, this._hass)) {
            if (this.config.default) {
                return html`<div class="state entity" style="${entityStyles(this.config)}">
                    ${this.renderMainHeader()}
                    <div>${this.config.default}</div>
                </div>`;
            }
            return null;
        }
        const gesture = this.getGestureHandlers('main', this.config.entity, this.config);
        return html`<div
            class="state entity"
            style="${entityStyles(this.config)}"
            @pointerdown="${gesture?.onDown}"
            @pointerup="${gesture?.onUp}"
            @pointercancel="${gesture?.onCancel}"
            @mousedown="${stopBubble}"
            @click="${stopBubble}"
            @touchstart="${stopBubble}"
            @touchend="${stopBubble}"
            @touchcancel="${stopBubble}"
            @contextmenu="${stopBubble}"
        >
            ${this.renderMainHeader()}
            <div>${this.renderValue(this.stateObj, config)}</div>
        </div>`;
    }

    renderEntity(stateObj, config, index) {
        config = this._resolved(config);
        if (!stateObj || hideIf(stateObj, config, this._hass)) {
            if (config.default) {
                // Same header resolution as a visible entity (friendly-name fallback etc., see
                // #302) - except when the entity is missing entirely, where only an explicit
                // name can label it.
                return html`<div class="entity" style="${entityStyles(config)}">
                    <span>${stateObj ? entityName(stateObj, config) : config.name}</span>
                    <div>${config.default}</div>
                </div>`;
            }
            return null;
        }
        const gesture = this.getGestureHandlers(`sub-${index}`, stateObj.entity_id, config);
        return html`<div
            class="entity"
            style="${entityStyles(config)}"
            @pointerdown="${gesture?.onDown}"
            @pointerup="${gesture?.onUp}"
            @pointercancel="${gesture?.onCancel}"
            @mousedown="${stopBubble}"
            @click="${stopBubble}"
            @touchstart="${stopBubble}"
            @touchend="${stopBubble}"
            @touchcancel="${stopBubble}"
            @contextmenu="${stopBubble}"
        >
            <span>${entityName(stateObj, config) ?? this.headerPlaceholder()}</span>
            <div>
                ${config.icon || isObject(config.state_icon)
                    ? this.renderIcon(stateObj, config)
                    : this.renderValue(stateObj, config)}
            </div>
        </div>`;
    }

    // Main-state counterpart of headerPlaceholder(): render the state_header, or reserve the
    // header line when sub-entities render headers so the main value stays level with theirs.
    renderMainHeader() {
        const header = this.config.state_header ?? this.headerPlaceholder();
        return header ? html`<span>${header}</span>` : null;
    }

    // An empty header span collapses to zero height, so a name:false entity's value floats
    // vertically centered while its headered siblings' values sit below their headers (see
    // #281). Reserve the header line with an nbsp - but only when some sibling actually renders
    // a header, so all-headerless rows keep their compact centered layout.
    headerPlaceholder() {
        const anyHeader =
            this.config.state_header !== undefined ||
            this.entities.some((entity) => entity.name !== false && (entity.name || entity.entity));
        return anyHeader ? '\u00a0' : null;
    }

    renderValue(stateObj, config) {
        if (config.toggle === true) {
            return this.renderToggle(stateObj, config);
        }
        // A value template replaces the displayed state entirely with its rendered result
        // (already resolved by _resolved; a still-raw template renders blank rather than leaking
        // Jinja source). Only an explicit unit is appended - format is deliberately skipped,
        // since rounding/formatting belong in the template itself.
        if (config.template !== undefined) {
            const value = hasTemplate(config.template) ? '' : config.template;
            return `${value}${config.unit ? ` ${config.unit}` : ''}`;
        }
        const isLastChangedAttr = config.attribute && [LAST_CHANGED, LAST_UPDATED].includes(config.attribute);
        // A configured timestamp format wins over the default relative-time widget for the
        // last-changed/last-updated pseudo-attributes - previously it was silently ignored
        // (see #221, #305). Those live on the state object itself (with underscores), not in
        // attributes, hence the mapped lookup.
        if (config.format && TIMESTAMP_FORMATS.includes(config.format)) {
            const value = isLastChangedAttr
                ? stateObj[config.attribute.replace('-', '_')]
                : config.attribute
                ? stateObj.attributes[config.attribute] ?? stateObj[config.attribute]
                : stateObj.state;
            const timestamp = new Date(value);
            if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
                return value;
            }
            return html`<hui-timestamp-display
                .hass=${this._hass}
                .ts=${timestamp}
                .format=${config.format}
                capitalize
            ></hui-timestamp-display>`;
        }
        if (isLastChangedAttr) {
            return html`<ha-relative-time
                .hass=${this._hass}
                .datetime=${stateObj[config.attribute.replace('-', '_')]}
                capitalize
            ></ha-relative-time>`;
        }
        return entityStateDisplay(this._hass, stateObj, config);
    }

    // ha-entity-toggle performs the toggle on its own tap, bypassing our action dispatch - so a
    // configured confirmation never ran (see #265). When tap_action carries a confirmation,
    // intercept the interaction ahead of the toggle (capture phase), ask, and forward the toggle
    // through HA ourselves only on OK.
    renderToggle(stateObj, config) {
        const confirmation = config.tap_action?.confirmation;
        if (!confirmation) {
            return html`<ha-entity-toggle .stateObj="${stateObj}" .hass="${this._hass}"></ha-entity-toggle>`;
        }
        const confirmToggle = {
            handleEvent: (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                const exempt =
                    isObject(confirmation) &&
                    confirmation.exemptions?.some((exemption) => exemption.user === this._hass.user?.id);
                const text =
                    (isObject(confirmation) && confirmation.text) ||
                    `Are you sure you want to toggle ${entityName(stateObj, config) ?? stateObj.entity_id}?`;
                if (exempt || confirm(text)) {
                    this._hass.callService('homeassistant', 'toggle', { entity_id: stateObj.entity_id });
                }
            },
            capture: true,
        };
        return html`<span @click=${confirmToggle}>
            <ha-entity-toggle .stateObj="${stateObj}" .hass="${this._hass}"></ha-entity-toggle>
        </span>`;
    }

    renderIcon(stateObj, config) {
        // Resolution order: state_icon[state] (see #197) → explicit icon → entity's own icon.
        const overrideIcon =
            stateIcon(stateObj, config) ?? (config.icon === true ? stateObj.attributes.icon || null : config.icon);
        return html`<state-badge
            class="icon-small"
            style="${iconColorCss(config.icon_color)}"
            .hass=${this._hass}
            .stateObj="${stateObj}"
            .overrideIcon="${overrideIcon}"
            .stateColor="${config.state_color}"
        ></state-badge>`;
    }

    renderWarning() {
        return html`<hui-warning>
            ${this._hass.localize('ui.panel.lovelace.warning.entity_not_found', 'entity', this.config.entity)}
        </hui-warning>`;
    }

    // Tap/hold/double-tap gesture handlers for one rendered entity (the main entity, or one of
    // this.entities by index), cached by key so an in-progress hold or double-tap window survives
    // a re-render triggered by an unrelated state update mid-gesture (see setConfig). Toggle-mode
    // entities render <ha-entity-toggle>, which handles its own tap directly - not wiring our own
    // gesture handling on top avoids the two conflicting over the same interaction (see #265,
    // which is about that toggle/action interaction specifically and is out of scope here).
    getGestureHandlers(key, entity, config) {
        if (config.toggle === true) {
            return null;
        }
        if (!this._actionHandlers.has(key)) {
            this._actionHandlers.set(
                key,
                createGestureHandlers((hold, dblClick) => this.dispatchAction(entity, config, hold, dblClick), {
                    hasHold: !!config.hold_action,
                    hasDoubleTap: !!config.double_tap_action,
                })
            );
        }
        return this._actionHandlers.get(key);
    }

    // Dispatch by firing HA's own hass-action event rather than performing the action ourselves
    // (the old custom-card-helpers handleClick call). Letting HA core execute it keeps native
    // confirmation dialogs and security-domain restrictions (lock/cover) in the loop, and
    // supports newer action types (perform-action, assist) for free. Approach adopted from the
    // duczz/ha-multiple-entity-row fork.
    dispatchAction(entity, config, hold, dblClick) {
        const actionConfig = dblClick
            ? config.double_tap_action
            : hold
            ? config.hold_action
            : config.tap_action ?? { action: 'more-info' };
        if (!actionConfig || actionConfig.action === 'none') {
            return;
        }
        const actionType = dblClick ? 'double_tap' : hold ? 'hold' : 'tap';
        fireEvent(this, 'hass-action', {
            config: {
                // actionConfig.entity overrides the more-info target (see #188)
                entity: actionConfig.entity || entity,
                [`${actionType}_action`]: actionConfig,
            },
            action: actionType,
        });
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);

// Registers the row with HA's card/row pickers so it's discoverable in the UI.
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'multiple-entity-row',
    name: 'Multiple Entity Row',
    description: 'Show multiple entity states and attributes on a single entity row',
});
