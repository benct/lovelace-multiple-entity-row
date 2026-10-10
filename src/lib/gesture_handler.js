// Detects tap/hold/double-tap gestures from pointer events and dispatches the resolved gesture
// via the given callback. HA's own internal <action-handler> element isn't exposed for
// third-party use, so this reimplements that detection directly.
//
// Kept framework-free (no DOM/Lit dependency) so gesture timing can be unit tested with fake
// timers, independent of rendering.

export const HOLD_TIME_MS = 500;
export const DOUBLE_TAP_WINDOW_MS = 250;

// HA's own handler ends a gesture on `click`, which only the primary button fires. Without this
// filter a right-click ran the tap action (on Windows, contextmenu comes after pointerup), and so
// did a middle-click or a second finger.
const isPrimaryPress = (ev) => ev.button === 0 && ev.isPrimary;

// dispatch(hold, dblClick) is called once per resolved gesture. hasHold/hasDoubleTap should be
// true only when the corresponding action is actually configured - like HA's native rows, a
// long-press without a hold_action resolves as a plain tap, and without a double_tap_action a
// tap dispatches immediately instead of waiting out the double-tap window for a second tap that
// will never come.
export const createGestureHandlers = (dispatch, { hasHold, hasDoubleTap }) => {
    let holdTimer;
    let held = false;
    let pendingTapTimer;
    // A release only counts after a press on this same entity, like HA's handler checking the
    // release target: a drag from elsewhere, released here, is not a tap. onCancel also runs on
    // pointerleave, so a press that drags off can't be completed by a later stray release.
    let down = false;

    const onDown = (ev) => {
        if (!isPrimaryPress(ev)) return;
        down = true;
        held = false;
        if (hasHold) {
            holdTimer = setTimeout(() => {
                held = true;
            }, HOLD_TIME_MS);
        }
    };

    const onCancel = () => {
        down = false;
        clearTimeout(holdTimer);
    };

    const onUp = (ev) => {
        if (!down || !isPrimaryPress(ev)) return;
        down = false;
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
