import { LitElement, html } from 'lit';

import { computeDisplayTimer, timerTimeRemaining } from './lib/timer';

// A timer's countdown has to advance without any hass update to trigger it, which the row itself
// cannot do: its shouldUpdate gate (hasConfigOrEntitiesChanged) returns false when no watched
// state changed, so a requestUpdate on the row every second would simply be swallowed. Keeping
// the interval in its own element sidesteps that gate and re-renders only the countdown text
// rather than the whole row.
//
// Modelled on HA's <ha-timer-remaining-time>, including the important part: the interval only
// runs while the timer is actually counting down. Idle and paused timers cost nothing, and the
// interval is cleared whenever the element leaves the DOM.
class TimerRemaining extends LitElement {
    static get properties() {
        return {
            hass: { attribute: false },
            stateObj: { attribute: false },
            _remaining: { state: true },
        };
    }

    // Light DOM, so the row's own styles apply to the text as they would to any other value.
    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this._startInterval();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._clearInterval();
    }

    willUpdate(changedProps) {
        // A new state object means the timer was started, paused or cancelled - recompute now and
        // start or stop ticking to match.
        if (changedProps.has('stateObj')) {
            this._startInterval();
        }
    }

    _clearInterval() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = undefined;
        }
    }

    _startInterval() {
        this._clearInterval();
        this._remaining = this.stateObj ? timerTimeRemaining(this.stateObj) : undefined;
        if (this.stateObj?.state === 'active') {
            this._interval = setInterval(() => {
                this._remaining = timerTimeRemaining(this.stateObj);
            }, 1000);
        }
    }

    render() {
        if (!this.hass || !this.stateObj) return html``;
        return html`${computeDisplayTimer(this.hass, this.stateObj, this._remaining)}`;
    }
}

customElements.define('multiple-entity-row-timer', TimerRemaining);
