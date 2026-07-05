import { css, html, LitElement } from 'lit';
import { handleClick } from 'custom-card-helpers';

import { LAST_CHANGED, LAST_UPDATED, TIMESTAMP_FORMATS } from './lib/constants';
import { createGestureHandlers } from './lib/gesture_handler';
import { checkEntity, entityName, entityStateDisplay, entityStyles } from './entity';
import { getEntityIds, hasConfigOrEntitiesChanged, hasGenericSecondaryInfo, hideIf, isObject } from './util';
import { style } from './styles';

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
    static get properties() {
        return {
            _hass: Object,
            config: Object,
            stateObj: Object,
        };
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
    }

    shouldUpdate(changedProps) {
        return hasConfigOrEntitiesChanged(this, changedProps);
    }

    set hass(hass) {
        this._hass = hass;

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

    render() {
        if (!this._hass || !this.config) return html``;
        if (!this.stateObj) return this.renderWarning();

        // catchInteraction: true tells hui-generic-entity-row not to attach its own tap/hold/
        // double-tap gesture detection to our slotted content. That detection is otherwise bound
        // to the whole slot and dispatches using only the row-level config (this.config), with no
        // awareness of which of our own rendered entities was actually interacted with - every
        // sub-entity click also double-fired the main entity's own action config. Each of our
        // entities gets its own tap/hold/double-tap handling in renderMainEntity/renderEntity
        // instead, correctly scoped to its own action config (see #338, #202).
        return html`<hui-generic-entity-row
            .hass="${this._hass}"
            .config="${this.config}"
            .secondaryText="${this.renderSecondaryInfo()}"
            .catchInteraction=${true}
        >
            <div class="${this.config.column ? 'entities-column' : 'entities-row'}">
                ${this.entities.map((entity, index) => this.renderEntity(entity.stateObj, entity, index))}${this.renderMainEntity()}
            </div>
        </hui-generic-entity-row>`;
    }

    renderSecondaryInfo() {
        if (
            !this.config.secondary_info ||
            hasGenericSecondaryInfo(this.config.secondary_info) ||
            hideIf(this.info, this.config.secondary_info, this._hass)
        ) {
            return null;
        }
        if (typeof this.config.secondary_info === 'string') {
            return html`${this.config.secondary_info}`;
        }
        const name = entityName(this.info, this.config.secondary_info);
        return html`${name} ${this.renderValue(this.info, this.config.secondary_info)}`;
    }

    renderMainEntity() {
        if (this.config.show_state === false) {
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
            ${this.config.state_header && html`<span>${this.config.state_header}</span>`}
            <div>${this.renderValue(this.stateObj, this.config)}</div>
        </div>`;
    }

    renderEntity(stateObj, config, index) {
        if (!stateObj || hideIf(stateObj, config, this._hass)) {
            if (config.default) {
                return html`<div class="entity" style="${entityStyles(config)}">
                    <span>${config.name}</span>
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
            <span>${entityName(stateObj, config)}</span>
            <div>${config.icon ? this.renderIcon(stateObj, config) : this.renderValue(stateObj, config)}</div>
        </div>`;
    }

    renderValue(stateObj, config) {
        if (config.toggle === true) {
            return html`<ha-entity-toggle .stateObj="${stateObj}" .hass="${this._hass}"></ha-entity-toggle>`;
        }
        if (config.attribute && [LAST_CHANGED, LAST_UPDATED].includes(config.attribute)) {
            return html`<ha-relative-time
                .hass=${this._hass}
                .datetime=${stateObj[config.attribute?.replace('-', '_')]}
                capitalize
            ></ha-relative-time>`;
        }
        if (config.format && TIMESTAMP_FORMATS.includes(config.format)) {
            const value = config.attribute
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
        return entityStateDisplay(this._hass, stateObj, config);
    }

    renderIcon(stateObj, config) {
        return html`<state-badge
            class="icon-small"
            .hass=${this._hass}
            .stateObj="${stateObj}"
            .overrideIcon="${config.icon === true ? stateObj.attributes.icon || null : config.icon}"
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
                createGestureHandlers(
                    (hold, dblClick) => this.dispatchAction(entity, config, hold, dblClick),
                    !!config.double_tap_action
                )
            );
        }
        return this._actionHandlers.get(key);
    }

    dispatchAction(entity, config, hold, dblClick) {
        handleClick(
            this,
            this._hass,
            {
                entity,
                tap_action: config.tap_action,
                hold_action: config.hold_action,
                double_tap_action: config.double_tap_action,
            },
            hold,
            dblClick
        );
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);
