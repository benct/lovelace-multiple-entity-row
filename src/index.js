import { css, html, LitElement } from 'lit';

import { LAST_CHANGED, LAST_UPDATED, TIMESTAMP_FORMATS } from './lib/constants';
import { createGestureHandlers } from './lib/gesture_handler';
import { defineElement } from './lib/define';
import { badgeColorProps, resolveColor, rowColorConfig } from './color';
import { checkEntity, entityName, entityStateDisplay, entityStyles, iconColorCss, stateIcon } from './entity';
import { fireEvent, getEntityIds, hasConfigOrEntitiesChanged, hasGenericSecondaryInfo, hideIf, isObject } from './util';
import {
    hasTemplate,
    resolveActionConfig,
    resolveTemplateFields,
    scopeVars,
    templateDisplay,
    TemplateSubscriptions,
} from './templates';
import { style } from './styles';
import './editor';
import './timer_remaining';

// hui-generic-entity-row attaches its own tap/hold/double-tap detection to the outer row
// element unconditionally (see the catchInteraction comment in render() below) via mousedown/
// click/touchstart/touchend/touchcancel/contextmenu listeners - a disjoint event set from the
// pointerdown/pointerup/pointercancel we use for our own per-entity detection, so stopPropagation
// on our own pointer events doesn't touch it. Stopping propagation of that exact event set at each
// entity's own element keeps it from ever reaching the row's listener, so only our per-entity
// dispatch fires (see #338, #202, #188, #251).
const stopBubble = (event) => event.stopPropagation();

const NBSP = '\u00a0';

// `name: ' '` is the common idiom for "no header here" and must behave exactly like name:false,
// so blank names collapse to null and go through the same headerPlaceholder path. #418 got this
// wrong by rendering them as an nbsp: that kept blank-named entities level with each other, but
// made an all-blank row reserve a header line nothing needed, dropping its values below the row
// name (see #421). Whether a line is reserved is headerPlaceholder's decision alone.
const blankName = (text) => (typeof text === 'string' && text.trim() === '' ? null : text);

// The reserved header line exists so a blank-named entity's value shares a baseline with its
// headered siblings' values (#281). A control has no baseline, so reserving one above it buys
// nothing and just makes the row taller - which costs real information density on rows mixing
// named values with icon-only entities (see #425). Of everything renderValue can produce, only
// these two are non-text: an ha-entity-toggle and a state-badge. hui-timestamp-display and
// ha-relative-time render ordinary text and must keep reserving.
//
// Sub-entity slots only. The main state slot renders text or a toggle and never an icon, because
// a row-level `icon:` is the ROW's icon drawn by hui-generic-entity-row - feeding it through here
// would make any row with an icon skip the placeholder for a perfectly ordinary text state.
const rendersControl = (config) => config.toggle === true || !!config.icon || isObject(config.state_icon);

// Entities are flex items, so vertical alignment belongs on their container - `styles` only
// reaches one entity's own div, where vertical-align does nothing (see #261). `center` is the
// default and needs no class.
const ALIGN_CLASSES = { top: 'align-top', bottom: 'align-bottom' };

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
        // Remembered before the normalization below erases it: `name: false` should remove HA's
        // name box entirely rather than blank it (see hideName in render).
        this._nameHidden = config.name === false;

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
        // scopeVars merges the row's `vars` with this scope's own; passing this.config as the
        // entry for the row itself is a no-op merge, so every scope goes through one path.
        return resolveTemplateFields(
            config,
            this._templateResults,
            config.entity ?? this.config.entity,
            scopeVars(this.config, config)
        );
    }

    render() {
        if (!this._hass || !this.config) return html``;
        if (!this.stateObj) return this.renderWarning();

        const config = this._resolved(this.config);
        // A state_icon match overrides the main row's icon by injecting it into the config
        // handed to hui-generic-entity-row, which owns the main icon rendering (see #197).
        const mainStateIcon = stateIcon(this.stateObj, config);
        const rowConfig = {
            ...config,
            ...(mainStateIcon ? { icon: mainStateIcon } : {}),
            ...rowColorConfig(resolveColor(config)),
        };

        // catchInteraction must stay false: despite the name it does NOT control whether
        // hui-generic-entity-row handles interaction (its actionHandler is bound to the .row
        // wrapper unconditionally - that was the #338 root cause, and what actually protects us
        // is stopBubble on each entity element). All it selects is the markup around our slot:
        // false yields a bare <slot>, true wraps it in `.text-content.value > .state`. Those two
        // extra boxes are shrink-to-fit, so they pin our row to its own content width and break
        // any `width: 100%` / justify-content styling users apply to .entities-row - it spread
        // across the row up to 4.6.1 and stopped in 4.7.0 when this was flipped to true (see
        // #411). Keeping the bare slot also keeps .entities-row as the flex item, which is the
        // only reason our own CSS (wrap, shrinking) can affect overflow at all.
        // `name: false` used to be blanked to a space, which left HA's name box in place taking
        // its flex: 1 1 30% share; hideName drops the box so the entities get that width back
        // (see #341, #365). HA renders secondary info inside that same box, though, so only hide
        // it when there is no secondary info to lose.
        const hideName = this._nameHidden && !this.config.secondary_info;
        return html`<hui-generic-entity-row
            style="${iconColorCss(config.icon_color)}"
            .hass="${this._hass}"
            .config="${rowConfig}"
            .secondaryText="${this.renderSecondaryInfo()}"
            .hideName=${hideName}
            .catchInteraction=${false}
        >
            <div
                class="${[
                    this.config.column ? 'entities-column' : 'entities-row',
                    !this.config.column && this.config.wrap ? 'wrap' : '',
                    ALIGN_CLASSES[this.config.align] ?? '',
                    hideName ? 'no-name' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}"
            >
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
                ? templateDisplay(this._templateResults, secondaryInfo, this.config.entity, scopeVars(this.config))
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
                    <span
                        >${blankName(stateObj ? entityName(stateObj, config) : config.name) ??
                        this.headerPlaceholder()}</span
                    >
                    <div>${config.default}</div>
                </div>`;
            }
            // A missing entity is nearly always a renamed or removed id, and dropping the slot
            // silently leaves no clue which one (see #364). `hide_unavailable` is documented as
            // the way to hide an entity that "is unavailable or does not exist", so honour that
            // and mark the gap otherwise. Not a header slot: the marker is an icon (see #425).
            if (!stateObj && !config.hide_unavailable) {
                return html`<div
                    class="entity"
                    style="${entityStyles(config)}"
                    title="${this._hass.localize(
                        'ui.panel.lovelace.warning.entity_not_found',
                        'entity',
                        config.entity ?? ''
                    )}"
                >
                    <span>${blankName(config.name)}</span>
                    <div><ha-icon class="missing" icon="mdi:alert-circle-outline"></ha-icon></div>
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
            <span
                >${blankName(entityName(stateObj, config)) ??
                (rendersControl(config) ? null : this.headerPlaceholder())}</span
            >
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
        // Only `toggle` counts as a control here - see the rendersControl comment for why a
        // row-level `icon:` must not.
        const header =
            blankName(this.config.state_header) ?? (this.config.toggle === true ? null : this.headerPlaceholder());
        return header ? html`<span>${header}</span>` : null;
    }

    // An empty header span collapses to zero height, so a name:false entity's value floats
    // vertically centered while its headered siblings' values sit below their headers (see
    // #281). Reserve the header line with an nbsp - but only when some sibling actually renders
    // a header, so all-headerless rows keep their compact centered layout.
    headerPlaceholder() {
        // name:false and name:' ' both mean "no header"; an unset name falls back to the entity's
        // friendly name, which is one.
        const rendersHeader = (config) =>
            config.name !== false && blankName(config.name) !== null && !!(config.name || config.entity);
        const anyHeader =
            blankName(this.config.state_header) != null || this.entities.some((entity) => rendersHeader(entity));
        return anyHeader ? NBSP : null;
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
        // A timer's raw state is just active/idle/paused, which is rarely what anyone wants to
        // see - HA's own timer row shows the countdown instead (see #65, #299, #350). Automatic
        // for the timer domain, but only for the state itself: an explicit attribute or template
        // above still wins, and an idle timer falls through to its localized state anyway.
        if (!config.attribute && stateObj.entity_id?.startsWith('timer.')) {
            return html`<multiple-entity-row-timer
                .hass=${this._hass}
                .stateObj=${stateObj}
            ></multiple-entity-row-timer>`;
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
        const confirmToggle = confirmation
            ? {
                  handleEvent: (ev) => {
                      ev.stopPropagation();
                      ev.preventDefault();
                      const exempt =
                          isObject(confirmation) &&
                          confirmation.exemptions?.some((exemption) => exemption.user === this._hass.user?.id);
                      // The dialog reads confirmation.text straight from the config, so a
                      // templated one has to be resolved here too or it shows raw Jinja.
                      const configured = isObject(confirmation) && confirmation.text;
                      const text = hasTemplate(configured)
                          ? templateDisplay(
                                this._templateResults,
                                configured,
                                config.entity ?? this.config.entity,
                                scopeVars(this.config, config)
                            )
                          : configured ||
                            `Are you sure you want to toggle ${entityName(stateObj, config) ?? stateObj.entity_id}?`;
                      if (exempt || confirm(text)) {
                          this._hass.callService('homeassistant', 'toggle', { entity_id: stateObj.entity_id });
                      }
                  },
                  capture: true,
              }
            : undefined;
        // ha-entity-toggle stops its own click, but our gesture handlers on the entity container
        // listen for pointerdown/pointerup - a disjoint event family it does not stop - so a tap
        // on the switch would toggle and dispatch the tap action. Stop the pointer family here
        // instead, which keeps the rest of the entity (header, name, value) clickable (see #415).
        return html`<span
            @pointerdown=${stopBubble}
            @pointerup=${stopBubble}
            @pointercancel=${stopBubble}
            @click=${confirmToggle}
        >
            <ha-entity-toggle .stateObj="${stateObj}" .hass="${this._hass}"></ha-entity-toggle>
        </span>`;
    }

    renderIcon(stateObj, config) {
        // Resolution order: state_icon[state] (see #197) → explicit icon → entity's own icon.
        const overrideIcon =
            stateIcon(stateObj, config) ?? (config.icon === true ? stateObj.attributes.icon || null : config.icon);
        // Exactly one of these is set (see badgeColorProps); the other stays undefined so
        // state-badge falls through to the one that is.
        const { stateColor, color } = badgeColorProps(resolveColor(config));
        // state-badge shows an entity picture instead of an icon when the entity has one and no
        // icon overrides it - and then it hides the icon and paints the picture as a background,
        // so the host needs its fixed box or there is nothing to give it height. Deciding that
        // here rather than leaning on state-badge's own has-image class, which it derives from
        // this.style.backgroundImage and therefore always applies one render late.
        const hasPicture =
            !overrideIcon && !!(stateObj.attributes.entity_picture || stateObj.attributes.entity_picture_local);
        return html`<state-badge
            class="icon-small${hasPicture ? ' has-picture' : ''}"
            style="${iconColorCss(config.icon_color)}"
            .hass=${this._hass}
            .stateObj="${stateObj}"
            .overrideIcon="${overrideIcon}"
            .stateColor="${stateColor}"
            .color="${color}"
        ></state-badge>`;
    }

    renderWarning() {
        return html`<hui-warning>
            ${this._hass.localize('ui.panel.lovelace.warning.entity_not_found', 'entity', this.config.entity)}
        </hui-warning>`;
    }

    // Tap/hold/double-tap gesture handlers for one rendered entity (the main entity, or one of
    // this.entities by index), cached by key so an in-progress hold or double-tap window survives
    // a re-render triggered by an unrelated state update mid-gesture (see setConfig).
    //
    // Toggle-mode entities get handlers too: they occupy a whole entity slot (header, name, and
    // the switch), and skipping them left everything but the switch itself dead to clicks (see
    // #415). renderToggle stops the pointer family at the switch so only the toggle acts there.
    getGestureHandlers(key, entity, config) {
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
        const raw = dblClick
            ? config.double_tap_action
            : hold
            ? config.hold_action
            : config.tap_action ?? { action: 'more-info' };
        if (!raw || raw.action === 'none') {
            return;
        }
        // Resolved here rather than in _resolved: gesture handlers are cached until the next
        // setConfig, so a config resolved at render time would be frozen at the first render
        // (see resolveActionConfig). The owner must match what collectTemplates subscribed with.
        const actionConfig = resolveActionConfig(
            raw,
            this._templateResults,
            config.entity ?? this.config.entity,
            scopeVars(this.config, config)
        );
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

defineElement('multiple-entity-row', MultipleEntityRow);

// Registers the row with HA's card/row pickers so it's discoverable in the UI.
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'multiple-entity-row',
    name: 'Multiple Entity Row',
    description: 'Show multiple entity states and attributes on a single entity row',
});
