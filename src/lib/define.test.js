import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineElement } from './define';

// Minimal registry double: controllable whenDefined, define/get backed by a map.
const makeRegistry = () => {
    const map = new Map();
    const waiters = new Map();
    return {
        define: vi.fn((name, ctor) => {
            if (map.has(name)) {
                throw new DOMException(`'${name}' has already been defined`);
            }
            map.set(name, ctor);
            waiters.get(name)?.resolve();
        }),
        get: (name) => map.get(name),
        whenDefined(name) {
            if (map.has(name)) {
                return Promise.resolve();
            }
            if (!waiters.has(name)) {
                let resolve;
                const promise = new Promise((r) => (resolve = r));
                waiters.set(name, { promise, resolve });
            }
            return waiters.get(name).promise;
        },
    };
};

const swapGlobalRegistry = (registry) =>
    Object.defineProperty(globalThis, 'customElements', { value: registry, configurable: true });

describe('defineElement', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'customElements');
    let loadRegistry;

    // Plain class: the registry doubles never construct it, and lib tests run without a DOM.
    class Dummy {}

    beforeEach(() => {
        vi.useFakeTimers();
        loadRegistry = makeRegistry();
        swapGlobalRegistry(loadRegistry);
    });

    afterEach(() => {
        vi.useRealTimers();
        if (originalDescriptor) {
            Object.defineProperty(globalThis, 'customElements', originalDescriptor);
        }
    });

    it('defines immediately into the current registry', () => {
        defineElement('x-test', Dummy);
        expect(loadRegistry.get('x-test')).toBe(Dummy);
    });

    it('tolerates the module being loaded twice', () => {
        defineElement('x-test', Dummy);
        // Second eval (e.g. extra_module_url + resources entry) brings its own class object.
        expect(() => defineElement('x-test', class {})).not.toThrow();
        expect(loadRegistry.get('x-test')).toBe(Dummy);
    });

    it('heals an element only once across repeated triggers', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        defineElement('x-test', Dummy);
        const polyfillRegistry = makeRegistry();
        swapGlobalRegistry(polyfillRegistry);
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(10000); // boot signal AND fallback timer both fire
        expect(polyfillRegistry.define).toHaveBeenCalledTimes(1);
        expect(info).toHaveBeenCalledTimes(1);
        info.mockRestore();
    });

    it('does not re-define when no swap happened', async () => {
        defineElement('x-test', Dummy);
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(10000);
        // one call for x-test, one for home-assistant itself
        expect(loadRegistry.define).toHaveBeenCalledTimes(2);
    });

    it('re-defines into a swapped-in registry once HA boot completes, and says so', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        defineElement('x-test', Dummy);
        const polyfillRegistry = makeRegistry();
        swapGlobalRegistry(polyfillRegistry);
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(0);
        expect(polyfillRegistry.get('x-test')).toBe(Dummy);
        expect(info).toHaveBeenCalledWith(expect.stringContaining('re-defined x-test'));
        expect(info).toHaveBeenCalledWith(expect.stringContaining('caught by ha-boot signal'));
        info.mockRestore();
    });

    it('heals via the fallback timer when the boot signal never fires, and says so', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        defineElement('x-test', Dummy);
        const polyfillRegistry = makeRegistry();
        swapGlobalRegistry(polyfillRegistry);
        await vi.advanceTimersByTimeAsync(5000);
        expect(polyfillRegistry.get('x-test')).toBe(Dummy);
        expect(info).toHaveBeenCalledWith(expect.stringContaining('caught by fallback timer'));
        info.mockRestore();
    });

    it('warns instead of throwing when the healing define is rejected', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        defineElement('x-test', Dummy);
        const brokenRegistry = {
            get: () => undefined,
            define: () => {
                throw new DOMException('nope');
            },
            whenDefined: () => new Promise(() => {}),
        };
        swapGlobalRegistry(brokenRegistry);
        await vi.advanceTimersByTimeAsync(5000);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
