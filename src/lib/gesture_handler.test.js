import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGestureHandlers, DOUBLE_TAP_WINDOW_MS, HOLD_TIME_MS } from './gesture_handler';

const PRIMARY = { button: 0, isPrimary: true };

beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    vi.useRealTimers();
});

describe('createGestureHandlers', () => {
    it('dispatches a tap immediately when no double-tap action is configured', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(PRIMARY);
        onUp(PRIMARY);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('dispatches a tap after the double-tap window elapses when no second tap follows', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: true });
        onDown(PRIMARY);
        onUp(PRIMARY);
        expect(dispatch).not.toHaveBeenCalled();
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('dispatches a double-tap when a second tap arrives within the window', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: true });
        onDown(PRIMARY);
        onUp(PRIMARY);
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS / 2);
        onDown(PRIMARY);
        onUp(PRIMARY);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, true);
    });

    it('dispatches a hold when the pointer is held past the hold threshold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(PRIMARY);
        vi.advanceTimersByTime(HOLD_TIME_MS);
        onUp(PRIMARY);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(true, false);
    });

    // Matches HA's native rows: without a hold_action, a long-press is just a slow tap.
    it('resolves a long-press as a tap when no hold action is configured', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: false, hasDoubleTap: false });
        onDown(PRIMARY);
        vi.advanceTimersByTime(HOLD_TIME_MS * 2);
        onUp(PRIMARY);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('does not dispatch a hold if released before the hold threshold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(PRIMARY);
        vi.advanceTimersByTime(HOLD_TIME_MS - 50);
        onUp(PRIMARY);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('does not dispatch anything on cancel, and does not leave a stale hold pending', () => {
        const dispatch = vi.fn();
        const { onDown, onCancel } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(PRIMARY);
        onCancel();
        vi.advanceTimersByTime(HOLD_TIME_MS + DOUBLE_TAP_WINDOW_MS);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('treats a hold on the second tap of what could have been a double-tap as a hold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: true });
        onDown(PRIMARY);
        onUp(PRIMARY);
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS / 2);
        onDown(PRIMARY);
        vi.advanceTimersByTime(HOLD_TIME_MS);
        onUp(PRIMARY);
        // The pending single-tap from the first press fires once its own window elapses,
        // independent of the second press's hold - both are legitimate, distinct gestures here.
        vi.runAllTimers();
        expect(dispatch).toHaveBeenCalledWith(true, false);
    });

    // HA's handler ends on `click`, which only the primary button fires; on Windows contextmenu
    // follows pointerup, so a right-click used to run the tap action.
    it.each([
        ['right button', { button: 2, isPrimary: true }],
        ['middle button', { button: 1, isPrimary: true }],
        ['second finger', { button: 0, isPrimary: false }],
    ])('ignores a %s press', (_, ev) => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(ev);
        vi.advanceTimersByTime(HOLD_TIME_MS);
        onUp(ev);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('ignores a release with no press on this entity (a drag from elsewhere)', () => {
        const dispatch = vi.fn();
        const { onUp } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onUp(PRIMARY);
        expect(dispatch).not.toHaveBeenCalled();
    });

    // onCancel runs on pointerleave too, so a press dragged off the entity is abandoned.
    it('does not complete a cancelled press on a later release', () => {
        const dispatch = vi.fn();
        const { onDown, onUp, onCancel } = createGestureHandlers(dispatch, { hasHold: true, hasDoubleTap: false });
        onDown(PRIMARY);
        onCancel();
        onUp(PRIMARY);
        expect(dispatch).not.toHaveBeenCalled();
    });
});
