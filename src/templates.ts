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

export const collectTemplates = (config: LooseObject): TemplateRequest[] => {
    const requests: TemplateRequest[] = [];
    const add = (template: unknown, entity?: string): void => {
        if (hasTemplate(template)) requests.push({ template, entity });
    };
    const collectEntry = (entry: LooseObject, owner?: string): void => {
        add(entry.name, owner);
        add(entry.icon, owner);
        add(entry.icon_color, owner);
        add(entry.template, owner);
        add(hideIfTemplate(entry), owner);
    };
    const main = config.entity as string | undefined;
    collectEntry(config, main);
    if (typeof config.secondary_info === 'string') {
        add(config.secondary_info, main);
    } else if (isObject(config.secondary_info)) {
        collectEntry(config.secondary_info, config.secondary_info.entity ?? main);
    }
    (config.entities as unknown[] | undefined)?.forEach((entry) => {
        if (isObject(entry)) collectEntry(entry as LooseObject, (entry as LooseObject).entity ?? main);
    });
    return requests;
};

/** A copy of `config` with its templated fields replaced by their current results (identity
 * when nothing is templated). `owner` must match the entity used at collect time. */
export const resolveTemplateFields = <T extends LooseObject>(
    config: T,
    results: TemplateResults,
    owner?: string
): T => {
    let resolved = config;
    const patch = (key: string, value: unknown): void => {
        if (resolved === config) resolved = { ...config };
        (resolved as LooseObject)[key] = value;
    };
    const get = (template: string): unknown => results.get(resultKey(template, owner));

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
    if (hasTemplate(config.template)) {
        patch('template', displayResult(get(config.template)));
    }
    const hideTemplate = hideIfTemplate(config);
    if (hideTemplate) {
        // Collapse to the boolean verdict hideIf understands. Pending renders visible, matching
        // hide_if.entity's missing-reference behavior.
        patch('hide_if', isTruthyResult(get(hideTemplate)));
    }
    return resolved;
};

/** Current display string for a standalone template (e.g. a templated secondary_info string). */
export const templateDisplay = (results: TemplateResults, template: string, entity?: string): string =>
    displayResult(results.get(resultKey(template, entity)));

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
