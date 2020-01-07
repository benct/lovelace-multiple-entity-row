const LitElement = Object.getPrototypeOf(customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class MultipleEntityRow extends LitElement {

    static get properties() {
        return {
            _hass: {},
            _config: {},
            state: {}
        }
    }

    static get styles() {
        return css`
      :host {
        display: flex;
        align-items: center;
      }
      .flex {
        flex: 1;
        margin-left: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 0;
      }
      .info {
        flex: 1 0 60px;
        cursor: pointer;
      }
      .info, .info > * {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .flex ::slotted(*) {
        margin-left: 8px;
        min-width: 0;
      }
      .flex ::slotted([slot="secondary"]) {
        margin-left: 0;
      }
      .secondary, ha-relative-time {
        display: block;
        color: var(--secondary-text-color);
      }
      state-badge {
        flex: 0 0 40px;
        cursor: pointer;
      }
      .entity {
        margin-right: 16px;
        text-align: center;
        cursor: pointer;
      }
      .entity span {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .entity:last-of-type {
        margin-right: 0;
      }
      .state {
        min-width: 45px;
      }
      .toggle {
        margin-left: 8px;
      }`;
    }

    renderEntity(data) {
        return data ? html`
        <div class="entity" @click="${() => this.fireEvent(data.entity)}">
            <span>${this.entityName(data)}</span>
            <div>${data.showToggle
            ? html`<ha-entity-toggle .stateObj="${data.stateObj}" .hass="${this._hass}"></ha-entity-toggle>`
            : data.showIcon ? html`<ha-icon icon="${data.showIcon}"></ha-icon>` : this.entityState(data)}
            </div>
        </div>` : null;
    }

    render() {
        return html`
    <state-badge
        .stateObj="${this.state.main.stateObj}"
        .overrideIcon="${this.state.main.icon}"
        @click="${this.defaultMoreInfo}">
    </state-badge>
    <div class="flex">
        <div class="info" @click="${this.defaultMoreInfo}">
            ${this.entityName(this.state.main)}
            <div class="secondary">
                ${this.state.info && `${this.entityName(this.state.info)} ${this.entityState(this.state.info)}`}
                ${this.state.showLastChanged
            ? html`<ha-relative-time datetime="${this.state.main.stateObj.last_changed}" .hass="${this._hass}"></ha-relative-time>`
            : null}
            </div>
        </div>
        ${this.renderEntity(this.state.primary)}
        ${this.renderEntity(this.state.secondary)}
        ${this.renderEntity(this.state.tertiary)}
        ${!this.state.main.hide_state ? html`
        <div class="state entity">
            ${this.state.main.name_state && html`<span>${this.state.main.name_state}</span>`}
            ${this.state.main.showToggle
            ? html`<div class="toggle"><ha-entity-toggle .stateObj="${this.state.main.stateObj}" .hass="${this._hass}"></ha-entity-toggle></div>`
            : html`<div @click="${this.defaultMoreInfo}">${this.entityState(this.state.main)}</div>`}
        </div>` : null}
    </div>`;
    }

    entityName(data) {
        return data && data.stateObj && data.name !== false ? this.computeStateName(data.stateObj, data.name) : null;
    }

    entityState(data) {
        if (!data || !data.stateObj) return this._hass.localize('state.default.unavailable');
        return data.attribute
            ? (data.attribute in data.stateObj.attributes)
                ? `${data.stateObj.attributes[data.attribute]} ${data.unit ? data.unit : ''}`
                : this._hass.localize('state.default.unavailable')
            : this.computeStateValue(data.stateObj, data.unit);
    }

    computeStateName(stateObj, name) {
        return name || (stateObj.attributes.friendly_name === undefined
            ? stateObj.entity_id.substr(stateObj.entity_id.indexOf('.') + 1).replace(/_/g, ' ')
            : stateObj.attributes.friendly_name || '');
    }

    computeStateValue(stateObj, unit) {
        let display;
        const domain = stateObj.entity_id.substr(0, stateObj.entity_id.indexOf("."));

        if (domain === "binary_sensor") {
            if (stateObj.attributes.device_class) {
                display = this._hass.localize(`state.${domain}.${stateObj.attributes.device_class}.${stateObj.state}`);
            }
            if (!display) {
                display = this._hass.localize(`state.${domain}.default.${stateObj.state}`);
            }
        } else if (unit !== false && (unit || stateObj.attributes.unit_of_measurement) && !["unknown", "unavailable"].includes(stateObj.state)) {
            display = `${stateObj.state} ${unit || stateObj.attributes.unit_of_measurement}`;
        } else if (domain === "zwave") {
            display = ["initializing", "dead"].includes(stateObj.state)
                ? this._hass.localize(`state.zwave.query_stage.${stateObj.state}`, 'query_stage', stateObj.attributes.query_stage)
                : this._hass.localize(`state.zwave.default.${stateObj.state}`);
        } else {
            display = this._hass.localize(`state.${domain}.${stateObj.state}`);
        }

        return display ||
            this._hass.localize(`state.default.${stateObj.state}`) ||
            this._hass.localize(`component.${domain}.state.${stateObj.state}`) ||
            stateObj.state;
    }

    setConfig(config) {
        if (!config.entity) throw new Error('Please define an entity.');
        if (config.primary && !config.primary.entity) throw new Error('Please define a primary entity.');
        if (config.secondary && !config.secondary.entity) throw new Error('Please define a secondary entity.');
        if (config.tertiary && !config.tertiary.entity) throw new Error('Please define a tertiary entity.');
        if (config.info && !config.info.entity) throw new Error('Please define an info entity.');

        this.state = {
            showLastChanged: config.secondary_info === 'last-changed' && !config.info
        };
        this._config = config;
    }

    set hass(hass) {
        this._hass = hass;

        if (hass && this._config) {
            this.state = {
                ...this.state,
                main: this.initEntity(this._config),
                primary: this.initEntity(this._config.primary),
                secondary: this.initEntity(this._config.secondary),
                tertiary: this.initEntity(this._config.tertiary),
                info: this.initEntity(this._config.info)
            }
        }
    }

    initEntity(config) {
        const stateObj = config && this._hass && this._hass.states[config.entity];
        return stateObj ? Object.assign({}, config, {
            stateObj: stateObj,
            showToggle: config.toggle === true && stateObj.state && !["unknown", "unavailable"].includes(stateObj.state),
            showIcon: config.icon === true ? stateObj.attributes.icon : config.icon
        }) : null;
    }

    defaultMoreInfo(e) {
        e.stopPropagation();
        this.fireEvent(this.state.main.entity);
    }

    fireEvent(entity, options = {}) {
        const event = new Event('hass-more-info', {
            bubbles: options.bubbles || true,
            cancelable: options.cancelable || true,
            composed: options.composed || true,
        });
        event.detail = {entityId: entity};
        this.dispatchEvent(event);
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);
