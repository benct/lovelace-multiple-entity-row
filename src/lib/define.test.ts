import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal registry double: controllable whenDefined, define/get backed by a map. The
// duplicate-define throw is load-bearing - it would catch removal of defineElement's guard.
const makeRegistry = () => {
    const map = new Map<string, unknown>();
    const waiters = new Map<string, { promise: Promise<void>; resolve: () => void }>();
    return {
        define: vi.fn((name: string, ctor: unknown) => {
            if (map.has(name)) {
                throw new DOMException(`'${name}' has already been defined`);
            }
            map.set(name, ctor);
            waiters.get(name)?.resolve();
        }),
        get: (name: string) => map.get(name),
        whenDefined(name: string): Promise<void> {
            if (map.has(name)) {
                return Promise.resolve();
            }
            if (!waiters.has(name)) {
                let resolve!: () => void;
                const promise = new Promise<void>((r) => (resolve = r));
                waiters.set(name, { promise, resolve });
            }
            return waiters.get(name)!.promise;
        },
    };
};
type RegistryDouble = ReturnType<typeof makeRegistry>;

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'customElements');
const swapGlobalRegistry = (registry: object) =>
    Object.defineProperty(globalThis, 'customElements', { value: registry, configurable: true });

// The module captures customElements at import, so every test re-imports a fresh instance
// against the registry installed in beforeEach.
const importDefineElement = async () => (await import('./define')).defineElement;

describe('defineElement', () => {
    let loadRegistry: RegistryDouble;

    // Never constructed by the doubles, and lib tests run without a DOM.
    class Dummy {}
    const ctor = Dummy as unknown as CustomElementConstructor;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.resetModules();
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        loadRegistry = makeRegistry();
        swapGlobalRegistry(loadRegistry);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        // Node env has no original customElements descriptor - delete instead of leaking
        // the last test's double onto globalThis.
        if (originalDescriptor) {
            Object.defineProperty(globalThis, 'customElements', originalDescriptor);
        } else {
            delete (globalThis as { customElements?: unknown }).customElements;
        }
    });

    it('defines immediately into the current registry', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-test', ctor);
        expect(loadRegistry.get('x-test')).toBe(ctor);
    });

    it('skips a duplicate load with a warning instead of throwing', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-test', ctor);
        expect(() => defineElement('x-test', class {} as unknown as CustomElementConstructor)).not.toThrow();
        expect(loadRegistry.get('x-test')).toBe(ctor);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('already defined'));
    });

    it('survives a registry whose define throws, so module eval continues', async () => {
        swapGlobalRegistry({
            get: () => undefined,
            define: () => {
                throw new DOMException('nope');
            },
            whenDefined: () => new Promise(() => {}),
        });
        const defineElement = await importDefineElement();
        expect(() => defineElement('x-test', ctor)).not.toThrow();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('defining x-test failed'), expect.anything());
    });

    it('does nothing on a healthy load - no swap, no logs, no extra defines', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-test', ctor);
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(60000);
        // one call for x-test, one for home-assistant itself
        expect(loadRegistry.define).toHaveBeenCalledTimes(2);
        expect(console.info).not.toHaveBeenCalled();
    });

    it('heals all elements in one batch via the boot signal after a swap', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-a', ctor);
        defineElement('x-b', ctor);
        const polyfillRegistry = makeRegistry();
        swapGlobalRegistry(polyfillRegistry);
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(0);
        expect(polyfillRegistry.get('x-a')).toBe(ctor);
        expect(polyfillRegistry.get('x-b')).toBe(ctor);
        expect(console.info).toHaveBeenCalledTimes(1);
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('x-a, x-b'));
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('caught by ha-boot signal'));
    });

    it('heals a swap that lands late, after the boot signal fired pre-swap', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-test', ctor);
        // Boot signal fires while the load registry is still current: must consume nothing.
        loadRegistry.define('home-assistant', class {});
        await vi.advanceTimersByTimeAsync(3000);
        expect(console.info).not.toHaveBeenCalled();
        // Swap arrives later than any single-shot timer would have covered.
        const polyfillRegistry = makeRegistry();
        swapGlobalRegistry(polyfillRegistry);
        await vi.advanceTimersByTimeAsync(9000);
        expect(polyfillRegistry.get('x-test')).toBe(ctor);
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('caught by fallback poll'));
    });

    it('stops retrying a failing heal when the poll window closes', async () => {
        const defineElement = await importDefineElement();
        defineElement('x-test', ctor);
        const rejecting = {
            get: () => undefined,
            define: vi.fn(() => {
                throw new DOMException('nope');
            }),
            whenDefined: () => new Promise<void>(() => {}),
        };
        swapGlobalRegistry(rejecting);
        await vi.advanceTimersByTimeAsync(120000);
        const attempts = rejecting.define.mock.calls.length;
        expect(attempts).toBeGreaterThan(0);
        expect(attempts).toBeLessThanOrEqual(30);
        await vi.advanceTimersByTimeAsync(60000);
        expect(rejecting.define.mock.calls.length).toBe(attempts);
    });
});
