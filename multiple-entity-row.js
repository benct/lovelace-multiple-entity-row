class MultipleEntityRow extends Polymer.Element {

    static get template() {
        return Polymer.html`
<style>
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
  }
  .entity {
    margin-right: 16px;
    text-align: center;
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
    text-align: end;
  }
  .toggle {
    margin-left: 8px;
  }
</style>
<state-badge state-obj="[[_config.stateObj]]" override-icon="[[_config.icon]]"></state-badge>
<div class="flex">
  <div class="info">
    [[entityName(_config)]]
    <div class="secondary">
      <template is="dom-if" if="{{displayInfo}}">
        [[entityName(info)]] [[entityState(info)]]
      </template>
      <template is="dom-if" if="{{displayLastChanged}}">
        <ha-relative-time datetime="[[_config.stateObj.last_changed]]" hass="[[_hass]]"></ha-relative-time>
      </template>
    </div>
  </div>
  <template is="dom-if" if="{{displayPrimary}}">
      <div class="entity" on-click="primaryMoreInfo">
        <span>[[entityName(primary)]]</span>
        <div>[[entityState(primary)]]</div>
      </div>
  </template>
  <template is="dom-if" if="{{displaySecondary}}">
      <div class="entity" on-click="secondaryMoreInfo">
        <span>[[entityName(secondary)]]</span>
        <div>[[entityState(secondary)]]</div>
      </div>
  </template>
  <template is="dom-if" if="{{displayValue}}">
    <div class="state">
      [[entityState(_config)]]
    </div>
  </template>
  <template is="dom-if" if="{{displayToggle}}">
    <div class="toggle">
      <ha-entity-toggle state-obj="[[_config.stateObj]]" hass="[[_hass]]"></ha-entity-toggle>
    </div>
  </template>
</div>`;
    }

    primaryMoreInfo(e) {
        e.stopPropagation();
        this.fireEvent(this._config.primary.entity)
    }

    secondaryMoreInfo(e) {
        e.stopPropagation();
        this.fireEvent(this._config.secondary.entity)
    }

    entityName(data) {
        return data && data.stateObj && data.name !== false ? this.computeStateName(data.stateObj, data.name) : null;
    }

    entityState(data) {
        if (!data || !data.stateObj) return this._hass.localize('state.default.unavailable');
        return data.attribute
            ? data.stateObj.attributes[data.attribute]
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
        } else if ((unit || stateObj.attributes.unit_of_measurement) && !["unknown", "unavailable"].includes(stateObj.state)) {
            display = `${stateObj.state} ${stateObj.attributes.unit_of_measurement}`;
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

        this._config = config;
        this.displayToggle = config.toggle === true;
        this.displayValue = !this.displayToggle && !config.hide_state;
        this.displayPrimary = config.primary && config.primary.entity;
        this.displaySecondary = config.secondary && config.secondary.entity;
        this.displayInfo = config.info && config.info.entity;
        this.displayLastChanged = !this.displayInfo && config.secondary_info === 'last-changed';
    }

    set hass(hass) {
        this._hass = hass;

        if (hass && this._config) {
            const stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
            if (stateObj) {
                this._config.stateObj = stateObj;

                this.primary = Object.assign({}, this._config.primary, {
                    stateObj: this.displayPrimary && this._config.primary.entity in hass.states ?
                        hass.states[this._config.primary.entity] : null
                });
                this.secondary = Object.assign({}, this._config.secondary, {
                    stateObj: this.displaySecondary && this._config.secondary.entity in hass.states ?
                        hass.states[this._config.secondary.entity] : null
                });
                this.info = Object.assign({}, this._config.info, {
                    stateObj: this.displayInfo && this._config.info.entity in hass.states ?
                        hass.states[this._config.info.entity] : null
                });
            }
        }
    }

    fireEvent(entity, options = {}) {
        const event = new Event('hass-more-info', {
            bubbles: options.bubbles || true,
            cancelable: options.cancelable || true,
            composed: options.composed || true,
        });
        event.detail = {entityId: entity};
        this.shadowRoot.dispatchEvent(event);
        return event;
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);
