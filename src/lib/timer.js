// Source: https://github.com/home-assistant/frontend/blob/dev/src/data/timer.ts
//
// Vendored rather than reusing HA's <ha-timer-remaining-time>: that element lives in a lazily
// loaded chunk, so it is only defined once a native timer row or more-info dialog has rendered.
// A dashboard built solely from our rows may never load it, and an undefined custom element
// renders blank (see #65, #299, #350).

import { secondsToDuration } from './seconds_to_duration';

const durationToSeconds = (duration) => {
    const parts = duration.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

/** Seconds left on a timer, or undefined when it has none. Counts down from `finishes_at` while
 * running, since `remaining` is only refreshed on state changes. */
export const timerTimeRemaining = (stateObj) => {
    if (!stateObj.attributes.remaining) {
        return undefined;
    }
    if (stateObj.state === 'active') {
        const finishes = new Date(stateObj.attributes.finishes_at).getTime();
        return Math.max((finishes - Date.now()) / 1000, 0);
    }
    return durationToSeconds(stateObj.attributes.remaining);
};

/** Idle (or finished) shows the localized state; running shows the countdown; paused shows both. */
export const computeDisplayTimer = (hass, stateObj, timeRemaining) => {
    if (stateObj.state === 'idle' || timeRemaining === 0) {
        return hass.formatEntityState(stateObj);
    }
    const display = secondsToDuration(timeRemaining || 0) ?? '0';
    return stateObj.state === 'paused' ? `${display} (${hass.formatEntityState(stateObj)})` : display;
};
