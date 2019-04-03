class MultipleEntityRow extends Polymer.Element {

    static get template() {
        return Polymer.html`
          <style>
            .flex {
              display: flex;
              align-items: center;
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
              text-transform: capitalize;
            }
            .toggle {
              margin-left: 8px;
            }
          </style>
          <hui-generic-entity-row hass="[[_hass]]" config="[[_config]]">
            <div class="flex">
              <template is="dom-if" if="{{displayPrimary}}">
                  <div class="entity">
                    <span>[[entityName(primary)]]</span>
                    <div>[[entityState(primary)]]</div>
                  </div>
              </template>
              <template is="dom-if" if="{{displaySecondary}}">
                  <div class="entity">
                    <span>[[entityName(secondary)]]</span>
                    <div>[[entityState(secondary)]]</div>
                  </div>
              </template>
              <template is="dom-if" if="{{displayValue}}">
                <div class="state">
                  [[mainState(stateObj)]]
                </div>
              </template>
              <template is="dom-if" if="{{displayToggle}}">
                <div class="toggle">
                  <ha-entity-toggle state-obj="[[stateObj]]" hass="[[_hass]]"></ha-entity-toggle>
                </div>
              </template>
            </div>
          </hui-generic-entity-row>
        `;
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
    }

    renderAttribute(data) {
        if (!data.stateObj.attributes[data.attribute]) return null;
        return data.stateObj.attributes[data.attribute] + (data.unit ? ` ${data.unit}` : '');
    }

    renderState(stateObj, unitOverride) {
        const unit = unitOverride || stateObj.attributes.unit_of_measurement;
        return stateObj.state + (unit ? ` ${unit}` : '');
    }

    entityName(data) {
        return data && data.stateObj && data.name !== false ? (data.name || data.stateObj.attributes.friendly_name) : null;
    }

    entityState(data) {
        if (!data || !data.stateObj) return null;
        return data.attribute ? this.renderAttribute(data) : this.renderState(data.stateObj, data.unit);
    }

    mainState(stateObj) {
        let i18n = this._hass.resources[this._hass.language];
        if (!stateObj) return i18n['state.default.unavailable'];
        return this.renderState(stateObj, this._config.unit);
    }

    set hass(hass) {
        this._hass = hass;

        if (hass && this._config) {
            this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;
            if (this.stateObj) {
                this.primary = Object.assign({}, this._config.primary, {
                    stateObj: this.displayPrimary && this._config.primary.entity in hass.states ?
                        hass.states[this._config.primary.entity] : null
                });
                this.secondary = Object.assign({}, this._config.secondary, {
                    stateObj: this.displaySecondary && this._config.secondary.entity in hass.states ?
                        hass.states[this._config.secondary.entity] : null
                });
            }
        }
    }
}

customElements.define('multiple-entity-row', MultipleEntityRow);
