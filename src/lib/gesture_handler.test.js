import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGestureHandlers, DOUBLE_TAP_WINDOW_MS, HOLD_TIME_MS } from './gesture_handler';

beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    vi.useRealTimers();
});

describe('createGestureHandlers', () => {
    it('dispatches a tap immediately when no double-tap action is configured', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, false);
        onDown();
        onUp();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('dispatches a tap after the double-tap window elapses when no second tap follows', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, true);
        onDown();
        onUp();
        expect(dispatch).not.toHaveBeenCalled();
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS);
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('dispatches a double-tap when a second tap arrives within the window', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, true);
        onDown();
        onUp();
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS / 2);
        onDown();
        onUp();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, true);
    });

    it('dispatches a hold when the pointer is held past the hold threshold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, false);
        onDown();
        vi.advanceTimersByTime(HOLD_TIME_MS);
        onUp();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(true, false);
    });

    it('does not dispatch a hold if released before the hold threshold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, false);
        onDown();
        vi.advanceTimersByTime(HOLD_TIME_MS - 50);
        onUp();
        expect(dispatch).toHaveBeenCalledExactlyOnceWith(false, false);
    });

    it('does not dispatch anything on cancel, and does not leave a stale hold pending', () => {
        const dispatch = vi.fn();
        const { onDown, onCancel } = createGestureHandlers(dispatch, false);
        onDown();
        onCancel();
        vi.advanceTimersByTime(HOLD_TIME_MS + DOUBLE_TAP_WINDOW_MS);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('treats a hold on the second tap of what could have been a double-tap as a hold', () => {
        const dispatch = vi.fn();
        const { onDown, onUp } = createGestureHandlers(dispatch, true);
        onDown();
        onUp();
        vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS / 2);
        onDown();
        vi.advanceTimersByTime(HOLD_TIME_MS);
        onUp();
        // The pending single-tap from the first press fires once its own window elapses,
        // independent of the second press's hold - both are legitimate, distinct gestures here.
        vi.runAllTimers();
        expect(dispatch).toHaveBeenCalledWith(true, false);
    });
});
