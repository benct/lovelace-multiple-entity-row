import { describe, expect, it, vi } from 'vitest';
import { computeDisplayTimer, timerTimeRemaining } from './timer';

const hass = { formatEntityState: vi.fn((stateObj) => `localized:${stateObj.state}`) };

const timer = (state, attributes) => ({ entity_id: 'timer.test', state, attributes });

describe('timerTimeRemaining', () => {
    it('is undefined for a timer with no remaining attribute', () => {
        expect(timerTimeRemaining(timer('idle', {}))).toBeUndefined();
    });

    // `remaining` is only refreshed on state changes, so a running timer has to be counted down
    // from finishes_at or it would sit still between updates.
    it('counts down from finishes_at while active', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-06T12:00:00Z'));
        const stateObj = timer('active', { remaining: '00:05:00', finishes_at: '2026-08-06T12:02:00.000Z' });
        expect(timerTimeRemaining(stateObj)).toBe(120);
        vi.advanceTimersByTime(30_000);
        expect(timerTimeRemaining(stateObj)).toBe(90);
        vi.useRealTimers();
    });

    it('never goes negative once finishes_at has passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-06T12:05:00Z'));
        const stateObj = timer('active', { remaining: '00:05:00', finishes_at: '2026-08-06T12:00:00.000Z' });
        expect(timerTimeRemaining(stateObj)).toBe(0);
        vi.useRealTimers();
    });

    // A paused timer is frozen, so the stored value is the truth.
    it('uses the stored remaining when paused', () => {
        expect(timerTimeRemaining(timer('paused', { remaining: '00:01:30' }))).toBe(90);
    });
});

describe('computeDisplayTimer', () => {
    it('shows the localized state when idle', () => {
        expect(computeDisplayTimer(hass, timer('idle', {}), undefined)).toBe('localized:idle');
    });

    it('shows the localized state when the countdown reaches zero', () => {
        expect(computeDisplayTimer(hass, timer('active', {}), 0)).toBe('localized:active');
    });

    it('shows the countdown while running', () => {
        expect(computeDisplayTimer(hass, timer('active', {}), 90)).toBe('1:30');
        expect(computeDisplayTimer(hass, timer('active', {}), 3661)).toBe('1:01:01');
    });

    it('appends the localized state when paused', () => {
        expect(computeDisplayTimer(hass, timer('paused', {}), 90)).toBe('1:30 (localized:paused)');
    });
});
