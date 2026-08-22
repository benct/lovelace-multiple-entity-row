// Server-side Jinja templating via HA's render_template websocket subscription - the same API
// the core markdown card and template dev tool use. Any supported config string containing
// {{ or {% is treated as a template (see #409, #35, #249, #278, #247, #254, #269, #270).
// HA tracks each template's entity dependencies itself and pushes a new result whenever they
// change, so templated fields need no getEntityIds bookkeeping - updates arrive even for
// entities the row doesn't otherwise watch.

import { isObject } from './util';
import { HASS, LooseObject } from './types';

interface TemplateRequest {
    template: string;
    entity?: string;
}

// {result, listeners} on success; {error, level} events when report_errors is set.
interface RenderTemplateMessage {
    result?: unknown;
    error?: string;
    level?: string;
}

export type TemplateResults = Map<string, unknown>;

export const hasTemplate = (value: unknown): value is string =>
    typeof value === 'string' && (value.includes('{{') || value.includes('{%'));

// Deep scan used by the editor: a template anywhere in the config forces YAML-only editing,
// since round-tripping Jinja strings through ha-form risks mangling them.
export const configHasTemplates = (value: unknown): boolean => {
    if (hasTemplate(value)) return true;
    if (Array.isArray(value)) return value.some(configHasTemplates);
    if (isObject(value)) return Object.values(value as LooseObject).some(configHasTemplates);
    return false;
};

// hide_if template: shorthand string form (hide_if: "{{ ... }}") or object form
// (hide_if: {template: "{{ ... }}"}). The object form ignores other criteria - a template
// subsumes value/below/above.
const hideIfTemplate = (config: LooseObject): string | undefined => {
    if (hasTemplate(config.hide_if)) return config.hide_if;
    if (isObject(config.hide_if) && hasTemplate(config.hide_if.template)) return config.hide_if.template;
    return undefined;
};

// render_template pushes native JSON types, not just strings: accept a real boolean result
// ({{ is_state(...) }}) as well as the string forms HA's own template conditions treat as true.
const TRUE_STRINGS = ['true', 'yes', 'on', '1'];
export const isTruthyResult = (result: unknown): boolean =>
    result === true ||
    result === 1 ||
    (typeof result === 'string' && TRUE_STRINGS.includes(result.trim().toLowerCase()));

// Pending (undefined) and none results render blank - never the raw Jinja source.
const displayResult = (result: unknown): string =>
    result === undefined || result === null ? '' : typeof result === 'object' ? JSON.stringify(result) : String(result);

// Results are keyed by (owner entity, template): the same template subscribed for two entities
// gets different `entity` variables, so the results are distinct.
const resultKey = (template: string, entity?: string): string => `${entity ?? ''}|${template}`;

// A single {{ ... }} expression with nothing around it and no other expression inside.
const SINGLE_EXPRESSION = /^\{\{((?:(?!\}\}).)*)\}\}$/s;

// One `vars` entry as a Jinja assignment. A lone expression is unwrapped so the variable keeps
// its native type ({% set n = states(x)|float %} stays a number); anything with surrounding text
// or several expressions goes through the capture form, which always yields a string.
const setStatement = (name: string, value: unknown): string => {
    if (typeof value === 'string' && hasTemplate(value)) {
        const single = SINGLE_EXPRESSION.exec(value.trim());
        return single ? `{% set ${name} = ${single[1].trim()} %}` : `{% set ${name} %}${value}{% endset %}`;
    }
    // Jinja's null literal is `none`; everything else JSON happens to share Jinja's syntax.
    return `{% set ${name} = ${value === null || value === undefined ? 'none' : JSON.stringify(value)} %}`;
};

/**
 * `vars` as a run of {% set %} statements to prepend to every templated field in the same scope
 * (see #422). Inlining keeps one subscription per field - HA renders the variables as part of
 * that template and tracks the entities they touch - instead of needing a second round of
 * subscriptions whose results feed the first.
 *
 * Declaration order is preserved, so a variable can build on an earlier one.
 *
 * This prefix is part of the string handed to HA and therefore part of the result cache key, so
 * collect and resolve MUST build it from this one helper or every lookup silently misses.
 */
export const varsPrefix = (vars: unknown): string =>
    isObject(vars)
        ? Object.entries(vars as LooseObject)
              .map(([name, value]) => setStatement(name, value))
              .join('')
        : '';

const ACTION_KEYS = ['tap_action', 'hold_action', 'double_tap_action'];

// Action configs are walked rather than enumerated: templates are just as useful in
// confirmation.text as in service data, a navigation_path or a target, and HA keeps adding
// action types. Anything that is a string containing Jinja is a template, wherever it sits.
const walkTemplates = (value: unknown, visit: (template: string) => void): void => {
    if (hasTemplate(value)) visit(value);
    else if (Array.isArray(value)) value.forEach((item) => walkTemplates(item, visit));
    else if (isObject(value)) Object.values(value as LooseObject).forEach((item) => walkTemplates(item, visit));
};

/**
 * A copy of one action config with its templated values replaced by current results (see #422).
 *
 * Resolved when the action fires rather than at render time: gesture handlers are cached until
 * the next setConfig, so anything baked in at render would be frozen at whatever the first render
 * saw - including still-pending results. Firing time also means the service call carries the
 * values as they are at the moment of the tap.
 */
export const resolveActionConfig = <T>(action: T, results: TemplateResults, owner?: string, vars?: LooseObject): T => {
    const prefix = varsPrefix(vars);
    const resolve = (value: unknown): unknown => {
        if (hasTemplate(value)) {
            // Native result, not a display string - service data frequently wants numbers or
            // booleans. A pending result becomes '' rather than leaking Jinja into a service call.
            const result = results.get(resultKey(prefix + value, owner));
            return result === undefined ? '' : result;
        }
        if (Array.isArray(value)) return value.map(resolve);
        if (isObject(value)) {
            return Object.fromEntries(Object.entries(value as LooseObject).map(([key, v]) => [key, resolve(v)]));
        }
        return value;
    };
    return resolve(action) as T;
};

/** Row-level `vars` merged with a scope's own, the scope winning. Sub-entities inherit the row's
 * variables and may shadow them. Must match what index.js hands resolveTemplateFields. */
export const scopeVars = (config: LooseObject, entry?: LooseObject): LooseObject => ({
    ...(isObject(config.vars) ? (config.vars as LooseObject) : {}),
    ...(entry && isObject(entry.vars) ? (entry.vars as LooseObject) : {}),
});

export const collectTemplates = (config: LooseObject): TemplateRequest[] => {
    const requests: TemplateRequest[] = [];
    // hasTemplate is checked against the raw field - the prefix itself contains {% %} and would
    // otherwise make every field look templated.
    const add = (template: unknown, entity?: string, prefix = ''): void => {
        if (hasTemplate(template)) requests.push({ template: prefix + template, entity });
    };
    const collectEntry = (entry: LooseObject, owner?: string, prefix = ''): void => {
        add(entry.name, owner, prefix);
        add(entry.icon, owner, prefix);
        add(entry.icon_color, owner, prefix);
        add(entry.color, owner, prefix);
        add(entry.template, owner, prefix);
        add(hideIfTemplate(entry), owner, prefix);
        if (isObject(entry.styles)) {
            Object.values(entry.styles as LooseObject).forEach((value) => add(value, owner, prefix));
        }
        ACTION_KEYS.forEach((key) => walkTemplates(entry[key], (template) => add(template, owner, prefix)));
    };
    const main = config.entity as string | undefined;
    collectEntry(config, main, varsPrefix(scopeVars(config)));
    if (typeof config.secondary_info === 'string') {
        add(config.secondary_info, main, varsPrefix(scopeVars(config)));
    } else if (isObject(config.secondary_info)) {
        const info = config.secondary_info as LooseObject;
        collectEntry(info, (info.entity as string) ?? main, varsPrefix(scopeVars(config, info)));
    }
    (config.entities as unknown[] | undefined)?.forEach((entry) => {
        if (isObject(entry)) {
            const item = entry as LooseObject;
            collectEntry(item, (item.entity as string) ?? main, varsPrefix(scopeVars(config, item)));
        }
    });
    return requests;
};

/** A copy of `config` with its templated fields replaced by their current results (identity
 * when nothing is templated). `owner` must match the entity used at collect time. */
export const resolveTemplateFields = <T extends LooseObject>(
    config: T,
    results: TemplateResults,
    owner?: string,
    vars?: LooseObject
): T => {
    let resolved = config;
    const patch = (key: string, value: unknown): void => {
        if (resolved === config) resolved = { ...config };
        (resolved as LooseObject)[key] = value;
    };
    // Same prefix collectTemplates subscribed with, or the key misses (see varsPrefix).
    const prefix = varsPrefix(vars);
    const get = (template: string): unknown => results.get(resultKey(prefix + template, owner));

    if (hasTemplate(config.name)) {
        // An empty name would fall back to the entity's friendly name in entityName - a pending
        // template must render blank instead of flashing the fallback, so pad to a space.
        patch('name', displayResult(get(config.name)) || ' ');
    }
    if (hasTemplate(config.icon)) {
        // While pending, behave like icon: true (the entity's own icon) so the slot doesn't
        // flip between icon and value rendering when the result lands.
        const result = get(config.icon);
        patch('icon', result === undefined || result === null || result === '' ? true : String(result));
    }
    if (hasTemplate(config.icon_color)) {
        const result = get(config.icon_color);
        patch('icon_color', typeof result === 'string' ? result : '');
    }
    if (hasTemplate(config.color)) {
        // A pending/failed color template must not resolve to the "state"/"none" default, so fall
        // back to 'none' rather than dropping the key and re-triggering default state coloring.
        const result = get(config.color);
        patch('color', typeof result === 'string' && result !== '' ? result : 'none');
    }
    if (hasTemplate(config.template)) {
        patch('template', displayResult(get(config.template)));
    }
    const hideTemplate = hideIfTemplate(config);
    if (hideTemplate) {
        // Collapse to the boolean verdict hideIf understands. Pending renders visible, matching
        // hide_if.entity's missing-reference behavior.
        patch('hide_if', isTruthyResult(get(hideTemplate)));
    }
    if (isObject(config.styles) && Object.values(config.styles as LooseObject).some(hasTemplate)) {
        // Per-declaration: a pending one resolves to '' and entityStyles drops it, so the
        // other declarations still apply while it is in flight (see #439).
        const styles = Object.fromEntries(
            Object.entries(config.styles as LooseObject).map(([key, value]) => [
                key,
                hasTemplate(value) ? displayResult(get(value)) : value,
            ])
        );
        patch('styles', styles);
    }
    return resolved;
};

/** Current display string for a standalone template (e.g. a templated secondary_info string). */
export const templateDisplay = (
    results: TemplateResults,
    template: string,
    entity?: string,
    vars?: LooseObject
): string => displayResult(results.get(resultKey(varsPrefix(vars) + template, entity)));

type UnsubscribeFunc = () => Promise<void> | void;

/** Owns the render_template subscriptions for one row element. Config, hass and DOM attachment
 * arrive in any order (and repeatedly - the card editor calls setConfig per keystroke), so every
 * entry point funnels into an idempotent sync() that reconciles active subscriptions with the
 * wanted set. Subscriptions only run while the element is connected; home-assistant-js-websocket
 * restores them itself across connection drops. */
export class TemplateSubscriptions {
    private hass?: HASS;
    private connected = false;
    private requests = new Map<string, TemplateRequest>();
    private unsubs = new Map<string, Promise<UnsubscribeFunc | null>>();
    private errors = new Map<string, string>();
    private results: TemplateResults = new Map();
    private notify: (results: TemplateResults) => void;

    constructor(notify: (results: TemplateResults) => void) {
        this.notify = notify;
    }

    setConfig(config: LooseObject): void {
        this.requests = new Map(collectTemplates(config).map((req) => [resultKey(req.template, req.entity), req]));
        this.sync();
    }

    setHass(hass?: HASS): void {
        const hadConnection = !!this.hass?.connection;
        this.hass = hass;
        if (!hadConnection && hass?.connection) this.sync();
    }

    connect(): void {
        this.connected = true;
        this.sync();
    }

    disconnect(): void {
        this.connected = false;
        this.sync();
    }

    private sync(): void {
        for (const [key, pending] of this.unsubs) {
            if (this.connected && this.requests.has(key)) continue;
            this.unsubs.delete(key);
            // Results survive a disconnect (instant repaint on reattach) but not a config
            // change that dropped the template.
            if (!this.requests.has(key)) {
                this.results.delete(key);
                this.errors.delete(key);
            }
            pending.then((unsub) => unsub?.()).catch(() => undefined);
        }
        if (!this.connected || !this.hass?.connection) return;
        for (const [key, request] of this.requests) {
            if (!this.unsubs.has(key)) this.unsubs.set(key, this.subscribe(key, request));
        }
    }

    private subscribe(key: string, request: TemplateRequest): Promise<UnsubscribeFunc | null> {
        return this.hass!.connection!.subscribeMessage(
            (message: RenderTemplateMessage) => this.onMessage(key, message),
            {
                type: 'render_template',
                template: request.template,
                variables: { entity: request.entity },
                report_errors: true,
            }
        ).catch((err: unknown) => {
            console.warn('multiple-entity-row: template subscription failed:', request.template, err);
            return null;
        });
    }

    private onMessage(key: string, message: RenderTemplateMessage): void {
        if (!this.unsubs.has(key)) return; // late event after unsubscribe
        if (message.error !== undefined) {
            // Errors repeat on every dependency change - warn only when the message changes.
            if (this.errors.get(key) !== message.error) {
                this.errors.set(key, message.error);
                console.warn('multiple-entity-row: template error:', message.error);
            }
            this.results.set(key, '');
        } else {
            this.errors.delete(key);
            this.results.set(key, message.result);
        }
        // Fresh Map identity so Lit sees the reactive property change.
        this.notify(new Map(this.results));
    }
}
