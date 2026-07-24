import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    collectTemplates,
    configHasTemplates,
    hasTemplate,
    isTruthyResult,
    resolveTemplateFields,
    TemplateResults,
    TemplateSubscriptions,
} from './templates';

const NAME_TEMPLATE = "{{ states('sensor.a') }} name";
const HIDE_TEMPLATE = "{{ is_state('binary_sensor.away', 'on') }}";

// Microtask/timer drain for the manager's promise-chained unsubscribes.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

interface MockSub {
    callback: (message: unknown) => void;
    message: Record<string, any>;
    unsub: ReturnType<typeof vi.fn>;
}

const buildConnection = () => {
    const subs: MockSub[] = [];
    return {
        subs,
        subscribeMessage: vi.fn((callback: (message: unknown) => void, message: Record<string, any>) => {
            const sub: MockSub = { callback, message, unsub: vi.fn(() => Promise.resolve()) };
            subs.push(sub);
            return Promise.resolve(sub.unsub);
        }),
    };
};

/** Manager wired to a mock connection, already connected. Returns the latest notified results. */
const buildManager = (config: Record<string, any>) => {
    const connection = buildConnection();
    let results: TemplateResults = new Map();
    const manager = new TemplateSubscriptions((r) => (results = r));
    manager.setConfig(config);
    manager.setHass({ connection } as any);
    manager.connect();
    return { connection, manager, results: () => results };
};

describe('hasTemplate', () => {
    it('detects {{ }} and {% %} in strings', () => {
        expect(hasTemplate('{{ states("sensor.a") }}')).toBe(true);
        expect(hasTemplate('{% if x %}y{% endif %}')).toBe(true);
    });

    it('is false for plain strings and non-strings', () => {
        expect(hasTemplate('Living Room')).toBe(false);
        expect(hasTemplate(false)).toBe(false);
        expect(hasTemplate({ template: '{{ x }}' })).toBe(false);
        expect(hasTemplate(undefined)).toBe(false);
    });
});

describe('configHasTemplates', () => {
    it('finds templates nested anywhere in the config', () => {
        expect(configHasTemplates({ entity: 'sensor.a', entities: [{ name: '{{ x }}' }] })).toBe(true);
        expect(configHasTemplates({ hide_if: { template: '{% if x %}true{% endif %}' } })).toBe(true);
    });

    it('is false for a template-free config', () => {
        expect(configHasTemplates({ entity: 'sensor.a', entities: ['sensor.b', { name: 'plain' }] })).toBe(false);
    });
});

describe('isTruthyResult', () => {
    it('accepts native true, 1 and the HA condition strings', () => {
        expect(isTruthyResult(true)).toBe(true);
        expect(isTruthyResult(1)).toBe(true);
        expect(isTruthyResult('true')).toBe(true);
        expect(isTruthyResult(' On ')).toBe(true);
        expect(isTruthyResult('YES')).toBe(true);
        expect(isTruthyResult('1')).toBe(true);
    });

    it('rejects everything else, including pending results', () => {
        expect(isTruthyResult(false)).toBe(false);
        expect(isTruthyResult('false')).toBe(false);
        expect(isTruthyResult('')).toBe(false);
        expect(isTruthyResult(0)).toBe(false);
        expect(isTruthyResult(undefined)).toBe(false);
        expect(isTruthyResult(null)).toBe(false);
    });
});

describe('collectTemplates', () => {
    it('collects templated fields with their owning entity', () => {
        const requests = collectTemplates({
            entity: 'sensor.main',
            name: NAME_TEMPLATE,
            icon_color: '{{ "red" }}',
            entities: ['sensor.plain', { entity: 'sensor.a', template: '{{ states(entity) }}' }, { name: 'static' }],
            secondary_info: { entity: 'sensor.b', name: '{{ y }}' },
        });
        expect(requests).toEqual([
            { template: NAME_TEMPLATE, entity: 'sensor.main' },
            { template: '{{ "red" }}', entity: 'sensor.main' },
            { template: '{{ y }}', entity: 'sensor.b' },
            { template: '{{ states(entity) }}', entity: 'sensor.a' },
        ]);
    });

    it('falls back to the main entity as owner for entity-less entries', () => {
        const requests = collectTemplates({
            entity: 'sensor.main',
            entities: [{ attribute: 'battery', name: '{{ x }}' }],
            secondary_info: '{{ z }}',
        });
        expect(requests).toEqual([
            { template: '{{ z }}', entity: 'sensor.main' },
            { template: '{{ x }}', entity: 'sensor.main' },
        ]);
    });

    it('collects both hide_if template forms', () => {
        const requests = collectTemplates({
            entity: 'sensor.main',
            hide_if: HIDE_TEMPLATE,
            entities: [{ entity: 'sensor.a', hide_if: { template: '{{ q }}' } }],
        });
        expect(requests).toEqual([
            { template: HIDE_TEMPLATE, entity: 'sensor.main' },
            { template: '{{ q }}', entity: 'sensor.a' },
        ]);
    });
});

describe('resolveTemplateFields', () => {
    const empty: TemplateResults = new Map();

    it('returns the config unchanged (same identity) when nothing is templated', () => {
        const config = { entity: 'sensor.a', name: 'plain' };
        expect(resolveTemplateFields(config, empty, 'sensor.a')).toBe(config);
    });

    it('renders a pending name as a space, not the friendly-name fallback', () => {
        const resolved = resolveTemplateFields({ entity: 'sensor.a', name: NAME_TEMPLATE }, empty, 'sensor.a');
        expect(resolved.name).toBe(' ');
    });

    it('treats a pending icon as icon: true so the slot stays in icon mode', () => {
        const resolved = resolveTemplateFields({ entity: 'sensor.a', icon: '{{ x }}' }, empty, 'sensor.a');
        expect(resolved.icon).toBe(true);
    });

    it('clears a pending icon_color and value template', () => {
        const resolved = resolveTemplateFields(
            { entity: 'sensor.a', icon_color: '{{ x }}', template: '{{ y }}' },
            empty,
            'sensor.a'
        );
        expect(resolved.icon_color).toBe('');
        expect(resolved.template).toBe('');
    });

    it('collapses a pending hide_if template to visible', () => {
        const resolved = resolveTemplateFields({ entity: 'sensor.a', hide_if: HIDE_TEMPLATE }, empty, 'sensor.a');
        expect(resolved.hide_if).toBe(false);
    });

    it('substitutes pushed results, stringifying non-string types', () => {
        const config = {
            entity: 'sensor.a',
            name: '{{ n }}',
            template: '{{ v }}',
            icon: '{{ i }}',
            hide_if: { template: '{{ h }}' },
        };
        const { connection, results } = buildManager(config);
        connection.subs.forEach((sub) => {
            const value = { '{{ n }}': 'Wind', '{{ v }}': 42, '{{ i }}': 'mdi:fan', '{{ h }}': true }[
                sub.message.template as string
            ];
            sub.callback({ result: value });
        });
        const resolved = resolveTemplateFields(config, results(), 'sensor.a');
        expect(resolved.name).toBe('Wind');
        expect(resolved.template).toBe('42');
        expect(resolved.icon).toBe('mdi:fan');
        expect(resolved.hide_if).toBe(true);
    });

    it('stringifies list/dict results as JSON instead of [object Object]', () => {
        const config = { entity: 'sensor.a', template: '{{ v }}' };
        const { connection, results } = buildManager(config);
        connection.subs[0].callback({ result: { a: 1 } });
        expect(resolveTemplateFields(config, results(), 'sensor.a').template).toBe('{"a":1}');
    });
});

describe('TemplateSubscriptions', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('subscribes with the render_template payload and owner entity variable', () => {
        const { connection } = buildManager({ entity: 'sensor.main', name: NAME_TEMPLATE });
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
        expect(connection.subs[0].message).toEqual({
            type: 'render_template',
            template: NAME_TEMPLATE,
            variables: { entity: 'sensor.main' },
            report_errors: true,
        });
    });

    it('does not subscribe until the element is connected', () => {
        const connection = buildConnection();
        const manager = new TemplateSubscriptions(() => undefined);
        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        manager.setHass({ connection } as any);
        expect(connection.subscribeMessage).not.toHaveBeenCalled();
        manager.connect();
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    });

    it('tolerates a hass without a websocket connection', () => {
        const manager = new TemplateSubscriptions(() => undefined);
        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        manager.setHass({} as any);
        expect(() => manager.connect()).not.toThrow();
    });

    it('subscribes once config, hass and connect have all arrived, in any order', () => {
        const connection = buildConnection();
        const manager = new TemplateSubscriptions(() => undefined);
        manager.connect();
        manager.setHass({ connection } as any);
        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(1);
    });

    it('notifies with a fresh results map on each pushed result', () => {
        const { connection, results } = buildManager({ entity: 'sensor.main', name: NAME_TEMPLATE });
        connection.subs[0].callback({ result: 'one' });
        const first = results();
        connection.subs[0].callback({ result: 'two' });
        expect(results()).not.toBe(first); // new identity so Lit sees the property change
        expect([...results().values()]).toEqual(['two']);
    });

    it('keeps unchanged subscriptions across a config change and drops removed ones', async () => {
        const { connection, manager, results } = buildManager({
            entity: 'sensor.main',
            name: NAME_TEMPLATE,
            icon_color: '{{ c }}',
        });
        connection.subs[1].callback({ result: 'red' });
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);

        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        await tick();
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(2); // no resubscribe churn
        expect(connection.subs[1].unsub).toHaveBeenCalled();
        // The dropped template's result is gone from the next notified map.
        connection.subs[0].callback({ result: 'name' });
        expect([...results().values()]).toEqual(['name']);
    });

    it('unsubscribes on disconnect and resubscribes on reconnect', async () => {
        const { connection, manager } = buildManager({ entity: 'sensor.main', name: NAME_TEMPLATE });
        manager.disconnect();
        await tick();
        expect(connection.subs[0].unsub).toHaveBeenCalled();

        manager.connect();
        expect(connection.subscribeMessage).toHaveBeenCalledTimes(2);
    });

    it('ignores late events arriving after unsubscribe', async () => {
        const notify = vi.fn();
        const connection = buildConnection();
        const manager = new TemplateSubscriptions(notify);
        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        manager.setHass({ connection } as any);
        manager.connect();
        manager.disconnect();
        await tick();
        connection.subs[0].callback({ result: 'late' });
        expect(notify).not.toHaveBeenCalled();
    });

    it('renders an error event as a blank result and warns only on message change', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { connection, results } = buildManager({ entity: 'sensor.main', name: NAME_TEMPLATE });
        connection.subs[0].callback({ error: 'boom', level: 'ERROR' });
        connection.subs[0].callback({ error: 'boom', level: 'ERROR' });
        expect([...results().values()]).toEqual(['']);
        expect(warn).toHaveBeenCalledTimes(1);

        connection.subs[0].callback({ result: 'recovered' });
        expect([...results().values()]).toEqual(['recovered']);
    });

    it('survives a rejected subscribe without an unhandled rejection', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const connection = {
            subscribeMessage: vi.fn(() => Promise.reject(new Error('no template integration'))),
        };
        const manager = new TemplateSubscriptions(() => undefined);
        manager.setConfig({ entity: 'sensor.main', name: NAME_TEMPLATE });
        manager.setHass({ connection } as any);
        manager.connect();
        await tick();
        expect(warn).toHaveBeenCalledTimes(1);
        manager.disconnect(); // unsub of the failed subscription is a no-op, not a crash
        await tick();
    });
});
