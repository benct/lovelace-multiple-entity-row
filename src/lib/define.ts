// HA 2026.8 ships the scoped-custom-element-registry polyfill, which replaces
// window.customElements during boot. When this resource module evaluates before the swap (a
// cold-load race - network throttling makes it deterministic, DevTools open hides it), our
// elements register into the native registry, which the polyfill's get()/whenDefined() then
// ignore - every row renders "Configuration error: Custom element doesn't exist"
// (frontend#52960). Re-defining through whichever registry has won self-heals: HA's error
// cards rebuild on whenDefined. A post-swap define of an already-natively-defined tag was
// verified to succeed through the polyfill on 2026.8.0.
//
// Detection never trusts a single moment: a check settles a name only once the registry
// object has actually changed, so checks that run before a late swap consume nothing. The
// bounded poll is the backstop for swaps landing well after load (slow devices); the
// whenDefined('home-assistant') signal is just an accelerator - HA installs the polyfill in
// its entrypoint before defining its own elements, so the signal resolves promptly on both
// sides of the race. Non-HA hosts simply run the poll to its end and stop.
const POLL_INTERVAL_MS = 1000;
const POLL_ROUNDS = 30;

const registryAtLoad = customElements;
// Elements still being watched; an entry leaves once its name is settled on a swapped-in
// registry, or the whole map is dropped when the poll window closes.
const pending = new Map<string, CustomElementConstructor>();
let rounds = 0;
let watching = false;

const check = (via: string): void => {
    try {
        // Identity is the direct signal: only a swapped-in registry can have "lost" our
        // definitions, so until it changes there is nothing to conclude - keep watching.
        if (customElements === registryAtLoad) {
            return;
        }
        const healed: string[] = [];
        for (const [name, ctor] of pending) {
            if (customElements.get(name)) {
                pending.delete(name);
                continue;
            }
            try {
                customElements.define(name, ctor);
                healed.push(name);
                pending.delete(name);
            } catch (e) {
                // Leave it pending - the poll retries a bounded number of times.
                console.warn(`multiple-entity-row: re-defining ${name} after registry swap failed`, e);
            }
        }
        if (healed.length) {
            // Loud on purpose: this line in a user's console is the tell that the race
            // happened at all. The poll catching it instead of the boot signal means the
            // whenDefined('home-assistant') assumption no longer holds.
            console.info(
                `multiple-entity-row: re-defined ${healed.join(
                    ', '
                )} after customElements registry swap, caught by ${via} (frontend#52960)`
            );
        }
    } catch (e) {
        console.warn('multiple-entity-row: customElements registry check failed', e);
    }
};

const poll = (): void => {
    if (!pending.size) {
        return;
    }
    if (rounds >= POLL_ROUNDS) {
        pending.clear();
        return;
    }
    rounds += 1;
    setTimeout(() => {
        check('fallback poll');
        poll();
    }, POLL_INTERVAL_MS);
};

const watch = (): void => {
    if (watching) {
        return;
    }
    watching = true;
    registryAtLoad
        .whenDefined('home-assistant')
        .then(() => check('ha-boot signal'))
        .catch(() => undefined);
    poll();
};

export const defineElement = (name: string, ctor: CustomElementConstructor): void => {
    try {
        if (registryAtLoad.get(name)) {
            // First copy wins, loudly: a silent skip would hide a stale cached bundle or a
            // second resource entry winning over the version the user thinks is running.
            console.warn(
                `multiple-entity-row: ${name} is already defined - a duplicate resource entry or stale cached copy loaded first`
            );
            return;
        }
        registryAtLoad.define(name, ctor);
    } catch (e) {
        // Never let a hostile registry abort module evaluation - a throw here would also
        // kill the sibling defines and the customCards registration in index.js.
        console.warn(`multiple-entity-row: defining ${name} failed`, e);
        return;
    }
    pending.set(name, ctor);
    watch();
};
