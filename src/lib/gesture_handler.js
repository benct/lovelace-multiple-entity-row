// Detects tap/hold/double-tap gestures from pointer events and dispatches the resolved gesture
// via the given callback. custom-card-helpers only dispatches a *given* gesture (handleClick takes
// hold/dblClick booleans) - it doesn't detect one, and HA's own internal <action-handler> element
// isn't exposed for third-party use - so this reimplements that detection directly.
//
// Kept framework-free (no DOM/Lit dependency) so gesture timing can be unit tested with fake
// timers, independent of rendering.

export const HOLD_TIME_MS = 500;
export const DOUBLE_TAP_WINDOW_MS = 250;

// dispatch(hold, dblClick) is called once per resolved gesture. hasDoubleTapAction should be true
// only when a double_tap_action is actually configured - otherwise a plain tap dispatches
// immediately instead of waiting out the double-tap window for a second tap that will never come.
export const createGestureHandlers = (dispatch, hasDoubleTapAction) => {
    let holdTimer;
    let held = false;
    let pendingTapTimer;

    const onDown = () => {
        held = false;
        holdTimer = setTimeout(() => {
            held = true;
        }, HOLD_TIME_MS);
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
        if (!hasDoubleTapAction) {
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
