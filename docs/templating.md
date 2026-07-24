# Templating

> **Beta:** templating ships in [4.8.0-beta.1](https://github.com/benct/lovelace-multiple-entity-row/releases/tag/v4.8.0-beta.1) and is not yet in a stable release. In HACS, enable _Show beta versions_ when redownloading to try it.

Since 4.8.0, display options accept Jinja **templates**. Templates are rendered by Home
Assistant server-side — the same engine as automations and the Developer Tools template
editor, with every HA template function and filter available — and results update live
whenever the entities a template references change.

Any supported option whose value contains `{{ }}` or `{% %}` is treated as a template;
there is no separate `*_template` key.

## Supported options

| Option           | Where                                    | Behavior                                              |
| ---------------- | ---------------------------------------- | ----------------------------------------------------- |
| `name`           | main row, additional entities, secondary | Result replaces the displayed name                    |
| `secondary_info` | as a plain string                        | Result replaces the secondary text                    |
| `icon`           | main row, additional entities            | Result is used as the icon (`mdi:...`)                |
| `icon_color`     | main row, additional entities            | Result is used as the CSS color                       |
| `template`       | main row, additional entities, secondary | Result replaces the displayed state value entirely    |
| `hide_if`        | as a plain string, or `hide_if.template` | Hides when the result renders true                    |

## The `entity` variable

Inside each template, `entity` holds the id of the entity that owns the option (the row's
main entity for row-level options, the sub-entity for per-entity options). This keeps
snippets portable — the same template works after a copy/paste onto another entity:

```yaml
entities:
  - entity: sensor.bedroom_temperature
    template: "{{ states(entity) | round(1) }}"
  - entity: sensor.kitchen_temperature
    template: "{{ states(entity) | round(1) }}"
```

## Value templates (`template:`)

`template:` replaces the displayed state value with the rendered result, shown verbatim:

- `format:` is ignored — do rounding, scaling and text transforms in the template itself.
- An explicit `unit:` is appended; the entity's own unit is not.
- Ignored for `toggle: true` entities (the toggle owns that slot).
- Non-string results are displayed sensibly: numbers as-is, lists/dicts as JSON.

```yaml
- type: custom:multiple-entity-row
  entity: sensor.washing_machine
  entities:
    # Substitution text instead of a raw state
    - entity: sensor.washer_status
      name: Status
      template: >-
        {{ 'No data' if is_state(entity, 'unavailable') else states(entity) | title }}
    # Math across entities
    - entity: sensor.power_usage
      name: Cost/h
      template: "{{ (states(entity) | float(0) * states('sensor.kwh_price') | float(0)) | round(2) }}"
      unit: €
    # Custom date format
    - entity: sensor.next_collection
      name: Pickup
      template: "{{ as_timestamp(states(entity)) | timestamp_custom('%d-%m') }}"
```

## Conditional hiding (`hide_if` templates)

A `hide_if` template hides its entity (or the main state, at row level) when the result
renders to `true`, `yes`, `on` or `1` — native boolean results and strings both work,
matching HA's own template-condition rules. Other `hide_if` criteria (`value`, `above`,
`below`) are ignored when a template is present; put the whole condition in the template.

```yaml
- type: custom:multiple-entity-row
  entity: alarm_control_panel.home
  entities:
    # Condition on another entity's attribute (not possible with plain hide_if)
    - entity: sensor.exit_delay
      hide_if: "{{ state_attr('alarm_control_panel.home', 'arm_state') != 'arming' }}"
    # Object form, e.g. alongside per-entity options
    - entity: sensor.battery
      hide_if:
        template: "{{ states(entity) | float(100) > 20 }}"
```

Unlike `hide_if.entity`, a template can reference any number of entities — HA tracks them
all and re-evaluates when any of them change.

## Names, icons and colors

```yaml
- type: custom:multiple-entity-row
  entity: sensor.next_ferry
  name: "Next ferry {{ state_attr(entity, 'time') }}"
  icon_color: "{{ 'red' if states('sensor.travel_time') | float(0) > 30 else 'green' }}"
  secondary_info: "updated {{ relative_time(states.sensor.next_ferry.last_updated) }} ago"
  entities:
    - entity: binary_sensor.ferry_docked
      icon: "{{ 'mdi:ferry' if is_state(entity, 'on') else 'mdi:waves' }}"
      name: Dock
```

## Behavior details

- **While loading**: a template's field renders blank until its first result arrives
  (typically well under a second) — never the raw Jinja source. A pending `hide_if`
  renders visible; a pending `icon` shows the entity's own icon.
- **Errors**: an erroring template renders blank and logs one warning per distinct error
  to the browser console. Test templates in **Developer Tools → Template** first.
- **Editor**: templated rows are YAML-only. Opening one in the visual editor shows
  "Config is not supported" and drops to the code editor — round-tripping Jinja through
  the form fields could corrupt it. Remove the templates and the visual editor works
  again.
- **Cost**: each distinct (template, entity) pair is one websocket subscription,
  established while the row is on screen and torn down when it leaves. A handful per row
  is fine; hundreds across a dashboard will add connection chatter.
