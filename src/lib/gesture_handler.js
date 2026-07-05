// Detects tap/hold/double-tap gestures from pointer events and dispatches the resolved gesture
// via the given callback. HA's own internal <action-handler> element isn't exposed for
// third-party use, so this reimplements that detection directly.
//
// Kept framework-free (no DOM/Lit dependency) so gesture timing can be unit tested with fake
// timers, independent of rendering.

export const HOLD_TIME_MS = 500;
export const DOUBLE_TAP_WINDOW_MS = 250;

// dispatch(hold, dblClick) is called once per resolved gesture. hasHold/hasDoubleTap should be
// true only when the corresponding action is actually configured - like HA's native rows, a
// long-press without a hold_action resolves as a plain tap, and without a double_tap_action a
// tap dispatches immediately instead of waiting out the double-tap window for a second tap that
// will never come.
export const createGestureHandlers = (dispatch, { hasHold, hasDoubleTap }) => {
    let holdTimer;
    let held = false;
    let pendingTapTimer;

    const onDown = () => {
        held = false;
        if (hasHold) {
            holdTimer = setTimeout(() => {
                held = true;
            }, HOLD_TIME_MS);
        }
    };

    const onCancel = () => {
        clearTimeout(holdTimer);
    };

    const onUp = () => {
        clearTimeout(holdTimer);
        if (held) {
            held = false;
            dispatch(true, false);
            return;
        }
        if (!hasDoubleTap) {
            dispatch(false, false);
            return;
        }
        if (pendingTapTimer) {
            clearTimeout(pendingTapTimer);
            pendingTapTimer = undefined;
            dispatch(false, true);
        } else {
            pendingTapTimer = setTimeout(() => {
                pendingTapTimer = undefined;
                dispatch(false, false);
            }, DOUBLE_TAP_WINDOW_MS);
        }
    };

    return { onDown, onUp, onCancel };
};
