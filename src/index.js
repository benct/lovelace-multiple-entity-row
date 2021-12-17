import { css, html, LitElement } from 'lit';
import { handleClick } from 'custom-card-helpers';

import { checkEntity, entityName, entityStateDisplay, entityStyles } from './entity';
import { getEntityIds, hasConfigOrEntitiesChanged, hasGenericSecondaryInfo, hideUnavailable, isObject } from './util';
import { style } from './styles';

console.info(
    '%c MULTIPLE-ENTITY-ROW %c 4.2.0 ',
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
        this.onRowClick = this.clickHandler(config.entity, config.tap_action);

        this.config = config;
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

        return html`<hui-generic-entity-row
            .hass="${this._hass}"
            .config="${this.config}"
            .secondaryText="${this.renderSecondaryInfo()}"
        >
            <div class="${this.config.column ? 'entities-column' : 'entities-row'}">
                ${this.entities.map((entity) => this.renderEntity(entity.stateObj, entity))}${this.renderMainEntity()}
            </div>
        </hui-generic-entity-row>`;
    }

    renderSecondaryInfo() {
        if (
            !this.config.secondary_info ||
            hasGenericSecondaryInfo(this.config.secondary_info) ||
            hideUnavailable(this.info, this.config.secondary_info)
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
        return html`<div class="state entity" style="${entityStyles(this.config)}" @click="${this.onRowClick}">
            ${this.config.state_header && html`<span>${this.config.state_header}</span>`}
            <div>${this.renderValue(this.stateObj, this.config)}</div>
        </div>`;
    }

    renderEntity(stateObj, config) {
        if (!stateObj || hideUnavailable(stateObj, config)) {
            return null;
        }
        const onClick = this.clickHandler(stateObj.entity_id, config.tap_action);
        return html`<div class="entity" style="${entityStyles(config)}" @click="${onClick}">
            <span>${entityName(stateObj, config)}</span>
            <div>${config.icon ? this.renderIcon(stateObj, config) : this.renderValue(stateObj, config)}</div>
        </div>`;
    }

    renderValue(stateObj, config) {
        if (config.toggle === true) {
            return html`<ha-entity-toggle .stateObj="${stateObj}" .hass="${this._hass}"></ha-entity-toggle>`;
        }
        if (config.format && ['relative', 'total', 'date', 'time', 'datetime'].includes(config.format)) {
            const value = config.attribute ? stateObj.attributes[config.attribute] : stateObj.state;
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

    clickHandler(entity, actionConfig) {
        return (e) => {
            e.stopPropagation();
            handleClick(this, this._hass, { entity, tap_action: actionConfig }, false, false);
        };
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);
