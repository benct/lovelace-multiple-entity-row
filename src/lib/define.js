// HA 2026.8 ships the scoped-custom-element-registry polyfill, which replaces
// window.customElements during boot. When this resource module evaluates before the swap (a
// cold-load race - DevTools being open changes the timing enough to hide it), our elements
// register into the native registry, which the polyfill's get()/whenDefined() then ignore -
// every row renders "Configuration error: Custom element doesn't exist" (frontend#52960).
// Re-defining through whichever registry has won self-heals: HA's error cards rebuild on
// whenDefined. Verified live on 2026.8.0 - a post-swap define of an already-natively-defined
// tag succeeds through the polyfill.
//
// The swap itself can't be intercepted (the polyfill wins any defineProperty fight over
// window.customElements), but it can be detected after the fact: HA installs the polyfill in
// its core entrypoint before defining its own elements, and polyfill defines must back onto
// the native registry for the browser to upgrade anything - so whenDefined('home-assistant')
// on the registry we loaded against resolves after the danger zone on both sides of the race.
// The timer is a belt-and-braces fallback in case that boot signal ever changes.
const FALLBACK_DELAY_MS = 5000;

const heal = (name, ctor, via) => {
    // A truthy get() means the current registry (original or swapped-in) knows the element,
    // whether as our ctor or a polyfill stand-in - nothing to do.
    if (customElements.get(name)) {
        return;
    }
    try {
        customElements.define(name, ctor);
        // Loud on purpose: this line in a user's console is the tell that the registry race
        // happened at all (it is invisible otherwise, and DevTools timing usually hides it).
        // `via` says which detector caught it - the boot signal should; the timer firing
        // instead means the whenDefined('home-assistant') assumption no longer holds.
        console.info(
            `multiple-entity-row: re-defined ${name} after customElements registry swap, caught by ${via} (frontend#52960)`
        );
    } catch (e) {
        console.warn(`multiple-entity-row: re-defining ${name} after registry swap failed (${via})`, e);
    }
};

// One heal (and one log line) per element name, however many card instances exist: the module
// evaluates once, and heal's get() check no-ops every call after the registry knows the name.
// The initial define is guarded for the same reason in reverse - the resource itself can be
// loaded twice (extra_module_url plus a resources entry, or URLs differing in cache-bust
// query), and a bare second define would throw mid-eval.
export const defineElement = (name, ctor) => {
    const registryAtLoad = customElements;
    if (!registryAtLoad.get(name)) {
        registryAtLoad.define(name, ctor);
    }
    registryAtLoad.whenDefined('home-assistant').then(() => heal(name, ctor, 'ha-boot signal'));
    setTimeout(() => heal(name, ctor, 'fallback timer'), FALLBACK_DELAY_MS);
};
