// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import './timer_remaining';

const flushRender = async (el) => {
    await el.updateComplete;
    await el.updateComplete;
};

const hass = { formatEntityState: vi.fn((stateObj) => `localized:${stateObj.state}`) };

const timer = (state, attributes) => ({ entity_id: 'timer.test', state, attributes });

describe('multiple-entity-row-timer', () => {
    let el;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-06T12:00:00Z'));
        el = document.createElement('multiple-entity-row-timer');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        vi.useRealTimers();
    });

    it('renders the countdown and advances it once a second', async () => {
        el.hass = hass;
        el.stateObj = timer('active', { remaining: '00:02:00', finishes_at: '2026-08-06T12:02:00.000Z' });
        await flushRender(el);
        expect(el.textContent).toBe('2:00');

        vi.advanceTimersByTime(1000);
        await flushRender(el);
        expect(el.textContent).toBe('1:59');
    });

    // The tick is the whole cost of this feature, so it must only run while counting down.
    it('does not tick while idle or paused', async () => {
        el.hass = hass;
        el.stateObj = timer('paused', { remaining: '00:01:30' });
        await flushRender(el);
        expect(el.textContent).toBe('1:30 (localized:paused)');
        expect(vi.getTimerCount()).toBe(0);

        el.stateObj = timer('idle', {});
        await flushRender(el);
        expect(el.textContent).toBe('localized:idle');
        expect(vi.getTimerCount()).toBe(0);
    });

    it('starts ticking when the timer becomes active and stops when it does not', async () => {
        el.hass = hass;
        el.stateObj = timer('idle', {});
        await flushRender(el);
        expect(vi.getTimerCount()).toBe(0);

        el.stateObj = timer('active', { remaining: '00:01:00', finishes_at: '2026-08-06T12:01:00.000Z' });
        await flushRender(el);
        expect(vi.getTimerCount()).toBe(1);

        el.stateObj = timer('paused', { remaining: '00:00:30' });
        await flushRender(el);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('clears its interval when removed from the DOM', async () => {
        el.hass = hass;
        el.stateObj = timer('active', { remaining: '00:01:00', finishes_at: '2026-08-06T12:01:00.000Z' });
        await flushRender(el);
        expect(vi.getTimerCount()).toBe(1);

        el.remove();
        expect(vi.getTimerCount()).toBe(0);
    });
});
