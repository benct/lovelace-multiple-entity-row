<div align="center">

# Multiple Entity Row

### Show multiple entity states, attributes and icons on a single entity row in Home Assistant Lovelace UI

[![HACS][hacs-badge]][hacs-url]
[![Home Assistant][ha-badge]][ha-url]
[![Version][version-badge]][release-url]
[![Downloads][downloads-badge]][release-url]
[![License][license-badge]](LICENSE)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=duczz&repository=ha-multiple-entity-row&category=lovelace)

</div>

---

A Lovelace **entity-row** that displays multiple entities, attributes, and icons in a single row inside an `entities` card. Modernised on Lit 3 + TypeScript + Rollup with a **HA-native visual editor**, **per-entity custom CSS**, **state-based icons**, and **icon coloring**.

> **Not a standalone card.** This is a *row element* used inside an [entities](https://www.home-assistant.io/lovelace/entities/) card — see [Configuration](#️-configuration).

---

## 🛠️ What's different from the original

This is a complete refresh of `benct/lovelace-multiple-entity-row` 4.5.1 on a current Home Assistant frontend stack (HA 2024.4+). All existing 4.x YAML configs continue to work unchanged.

### Modernisation
- ⚡ **Lit 3 + TypeScript 5.7 + Rollup 4** — full migration from Lit 2.7 / JavaScript + Babel / Webpack 5
- 📦 **No `custom-card-helpers`** — local types and own pointer-event handlers replace the deprecated wrapper
- 🌍 **HA-native formatters** — `src/lib/*` (HA-internal copies from 2020) replaced with `hass.formatEntityState`, `hass.formatEntityAttributeValue`, `hass.localize`, and `Intl.NumberFormat` — locale-aware out of the box
- 📁 **`dist/` build output** — moved from repo root to `dist/multiple-entity-row.js` (modern HACS layout)
- 🛡️ **Double-registration guard** — loading the bundle twice (HACS + manual resource) no longer throws
- 🆔 **`customCards` registration entry** — improves discovery in third-party tools
- 🕒 **BUILD_TIME injected** into the editor footer for HACS cache diagnostics

### Visual editor (new)
A `<ha-form>`-based editor that matches HA's own conventions and lives entirely inside the dashboard editor:
- 🗂️ **Native `<ha-tab-group>` tabs** — tab `1` is the main entity, tabs `2+` are the `entities[]` list (falls back to styled buttons on older HA)
- 🎛️ **Per-tab action row** — RTL-aware move-before / move-after, copy, cut, paste, delete (icons + `<ha-icon-button-arrow-prev/next>` from HA's own primitives)
- ➕ **Add empty entity** — `+` button appends a placeholder tab; empty `{}` slots are tolerated by the runtime until the user fills them in
- 📋 **Cross-row clipboard** — copy / cut / paste entity sub-configs between rows via sessionStorage (own key `multipleEntityRowClipboard`, doesn't pollute HA's card-picker)
- 📑 **"Copy main as template"** — duplicates main's per-entity-relevant fields as a clipboard entry, useful to seed similar additional entities
- 🧩 **Polymorphic secondary info** — None / Custom text / HA built-in token (`last-changed`, …) / Entity-based; mode switch preserves context
- 🎨 **Custom CSS per entity** — `<ha-code-editor mode="yaml">` block in every tab; edits round-trip into the per-entity `styles:` field
- 🌈 **Icon color per entity** — CSS color value (e.g. `red`, `#ff0000`, `var(--my-color)`) cascades into the state-badge across HA versions
- 🎯 **State-based icons** — `state_icon: { on: 'mdi:door-open', off: 'mdi:door-closed' }` map, edited as YAML in a small block at the bottom of each tab
- ⚙️ **Interactions panel** — tap / hold / double-tap action selectors for the main row, all functional (no longer silent no-ops)

### Bug fixes (upstream issues closed)
- 🔁 **`name` override not applying on first paint in HA 2026.2+** — `shouldUpdate` now also reacts to `hass.formatEntityName` reference swaps ([upstream PR #373](https://github.com/benct/lovelace-multiple-entity-row/pull/373), [#370](https://github.com/benct/lovelace-multiple-entity-row/issues/370), [#371](https://github.com/benct/lovelace-multiple-entity-row/issues/371))
- ✋ **`hold_action` / `double_tap_action` silently dead** — accepted in YAML but the 4.x runtime called `handleClick(..., false, false)`. Now wired via local pointer-event handlers ([#338](https://github.com/benct/lovelace-multiple-entity-row/issues/338), [#309](https://github.com/benct/lovelace-multiple-entity-row/issues/309), [#202](https://github.com/benct/lovelace-multiple-entity-row/issues/202), [#334](https://github.com/benct/lovelace-multiple-entity-row/issues/334))
- 🙈 **`hide_if` / `hide_unavailable` ignored on main row** — top-level hide rules now apply to the main state slot ([#227](https://github.com/benct/lovelace-multiple-entity-row/issues/227))
- 🎯 **`tap_action: { action: more-info, entity: X }` ignored the entity override** — main row now opens the named entity ([#188](https://github.com/benct/lovelace-multiple-entity-row/issues/188))
- 🔗 **`hide_if.entity` named-entity comparison** — `hide_if` may reference another entity / attribute to evaluate against ([upstream PR #280](https://github.com/benct/lovelace-multiple-entity-row/pull/280))
- 💯 **Number formatting respects locale / decimals** — `hass.formatEntityState` + `Intl.NumberFormat` ([#220](https://github.com/benct/lovelace-multiple-entity-row/issues/220), [#286](https://github.com/benct/lovelace-multiple-entity-row/issues/286), [#363](https://github.com/benct/lovelace-multiple-entity-row/issues/363))
- ✨ **`brightness` undefined when entity is unavailable** — guarded by `isUnavailable` ([#225](https://github.com/benct/lovelace-multiple-entity-row/issues/225))
- ⏱️ **`format: duration` returned `null` for value `0`** — `secondsToDuration` now returns `"0"` ([#240](https://github.com/benct/lovelace-multiple-entity-row/issues/240))

### Deep-dive fixes (own review)
- 🔁 **`hide_if.entity` references re-render-tracked** — `getEntityIds` picks up entity refs out of object-form `hide_if` so the row re-renders when the referenced entity changes
- 🧹 **Pointer timer cleanup on disconnect** — `disconnectedCallback` clears in-flight hold / double-tap timers
- 📥 **Empty `{}` placeholder safe** — `checkEntity` permits empty objects (kept by the editor between "+" and first edit); runtime silently skips rendering them
- ⚖️ **Toggle vertically centered** — `.entity ha-entity-toggle { display: inline-block }` so `text-align: center` actually centers the switch under its label

### New format modes
- 📊 **`percent`** — value × 100 with `%` appended ([#323](https://github.com/benct/lovelace-multiple-entity-row/issues/323))
- 🔠 **`upper` / `lower` / `capitalize` / `title`** — string transforms ([#367](https://github.com/benct/lovelace-multiple-entity-row/issues/367))

### Bug fixes carried over
- 🔁 **Element double-registration guard** — Card + Editor both protected
- 🪜 **`customCards.type` without `custom:` prefix** — HA's picker treats it as the element tag; the prefix would fail silently

> ⚠️ **Behaviour-change heads-up:** `hold_action` / `double_tap_action` on the main row, and `hide_if` / `hide_unavailable` at top level, **all start firing if they were set in your YAML**. They were silently no-ops in 4.x. If you had any of these in your config "just in case", review them before upgrading.

> **Versioning note:** The fork skipped `5.0.0` and `5.1.0` — modernisation, editor, and the upstream / deep-dive sweeps all ship together in `5.2.0` as the first modernised release.

For the full list of changes see [CHANGELOG.md](CHANGELOG.md).

---

## Table of Contents

- [What's different from the original](#️-whats-different-from-the-original)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#️-configuration)
  - [All options](#all-options)
  - [Entity Objects](#entity-objects)
  - [Special attributes](#special-attributes)
- [Secondary Info](#secondary-info)
- [Actions](#actions)
- [Formatting](#formatting)
- [Hiding](#hiding)
- [Icon styling](#icon-styling)
- [Custom CSS](#custom-css)
- [Examples](#examples)

---

## 📦 Requirements

- Home Assistant **2024.4** or higher (uses `hass.formatEntityState` and `hass.performAction`)
- HACS (recommended) or manual install

---

## 🚀 Installation

### HACS (recommended)

1. Open **HACS** in Home Assistant
2. Go to **Frontend** → three-dot menu → **Custom repositories**
3. Add this repository URL, category: **Lovelace**
4. Search for **Multiple Entity Row** and install
5. Reload the browser

### Manual

1. Download `multiple-entity-row.js` from the [latest release][release-url] and place it in `config/www/`.
2. Add to your Lovelace resources:

```yaml
resources:
  - url: /local/multiple-entity-row.js?v=1
    type: module
```

---

## ⚙️ Configuration

This card produces an `entity-row` and must therefore be configured as an entity inside an [entities](https://www.home-assistant.io/lovelace/entities/) card.

Minimal config:

```yaml
type: entities
entities:
  - entity: sensor.living_room_temperature
    type: custom:multiple-entity-row
    entities:
      - sensor.living_room_humidity
```

### All options

| Option              | Type            | Default                             | Description                                       |
| ------------------- | --------------- | ----------------------------------- | ------------------------------------------------- |
| `type`              | `string`        | **required**                        | `custom:multiple-entity-row`                      |
| `entity`            | `string`        | **required**                        | Main entity id (`domain.my_entity_id`)            |
| `attribute`         | `string`        | —                                   | Show an attribute instead of the state value      |
| `name`              | `string\|bool`  | `friendly_name`                     | Override entity friendly name (or `false` to hide) |
| `unit`              | `string\|bool`  | `unit_of_measurement`               | Override entity unit (or `false` to hide)         |
| `icon`              | `string`        | entity icon                         | Override entity icon                              |
| `icon_color`        | `string`        | —                                   | CSS color for the icon — new in 5.2.0             |
| `state_icon`        | `object`        | —                                   | Map of state → icon (`{ on: mdi:..., off: mdi:... }`) — new in 5.2.0 |
| `image`             | `string`        | —                                   | Show an image instead of icon                     |
| `toggle`            | `bool`          | `false`                             | Display a toggle (if supported) instead of state  |
| `show_state`        | `bool`          | `true`                              | Set to `false` to hide the main entity            |
| `state_header`      | `string`        | —                                   | Header text above the main entity state           |
| `state_color`       | `bool`          | `false`                             | Colored icon when the entity is active            |
| `column`            | `bool`          | `false`                             | Show entities in a column instead of a row        |
| `styles`            | `object`        | —                                   | Inline CSS styles applied to the state element    |
| `format`            | `string`        | _[Formatting](#formatting)_         | Format main state / attribute value               |
| `entities`          | `list`          | _[Entity Objects](#entity-objects)_ | Additional entity ids or entity objects           |
| `secondary_info`    | `string\|object`| _[Secondary Info](#secondary-info)_ | Custom `secondary_info` content                   |
| `tap_action`        | `object`        | `more-info`                         | Custom tap action on the entity row               |
| `hold_action`       | `object`        | `none`                              | Custom hold action on the entity row              |
| `double_tap_action` | `object`        | `none`                              | Custom double-tap action on the entity row        |

### Entity Objects

Each item in `entities[]` can be either an entity id string or an entity object. If you use an object, at least one of `entity`, `attribute`, or `icon` is required.

| Option             | Type            | Default                     | Description                                                        |
| ------------------ | --------------- | --------------------------- | ------------------------------------------------------------------ |
| `entity`           | `string`        | —                           | Entity id (skip to use the main entity)                            |
| `attribute`        | `string`        | —                           | Attribute key for the entity                                       |
| `name`             | `string\|bool`  | `friendly_name`             | Override entity name (or `false` to hide)                          |
| `unit`             | `string\|bool`  | `unit_of_measurement`       | Override entity unit (or `false` to hide)                          |
| `toggle`           | `bool`          | `false`                     | Display a toggle if supported by the entity domain                 |
| `icon`             | `string\|bool`  | `false`                     | Default or custom icon instead of state / attribute value          |
| `icon_color`       | `string`        | —                           | CSS color for the icon (any CSS color value) — new in 5.2.0        |
| `state_icon`       | `object`        | —                           | Map of state → icon (e.g. `{ on: mdi:..., off: mdi:... }`) — new in 5.2.0 |
| `state_color`      | `bool`          | `false`                     | Colored icon when the entity is active                             |
| `default`          | `string`        | —                           | Value shown if the entity does not exist or is hidden              |
| `hide_unavailable` | `bool`          | `false`                     | Hide the entity if unavailable                                     |
| `hide_if`          | `object\|any`   | _[Hiding](#hiding)_         | Hide the entity if value matches specified criteria                |
| `styles`           | `object`        | —                           | Inline CSS styles applied to this entity                           |
| `format`           | `string`        | _[Formatting](#formatting)_ | Format entity value                                                |
| `tap_action`       | `object`        | _[Actions](#actions)_       | Custom entity tap action                                           |

> `hold_action` and `double_tap_action` are **not** supported on additional entities (only on the main row).

### Special attributes

| `attribute` value | Renders                                                |
| ----------------- | ------------------------------------------------------ |
| `last-changed`    | Relative time since the entity last changed state      |
| `last-updated`    | Relative time since the entity was last updated        |

---

## Secondary Info

`secondary_info` can be:

- A **plain string** (`"Last updated 14:32"`) — rendered as-is below the entity name
- A **HA standard token** — one of `entity-id`, `last-changed`, `last-updated`, `last-triggered`, `position`, `tilt-position`, `brightness` — HA renders it via `hui-generic-entity-row`'s native secondary-info handling
- An **object** with the same fields as an entity object — custom value, formatter, hide rules, etc.

| Option             | Type            | Default                     | Description                                          |
| ------------------ | --------------- | --------------------------- | ---------------------------------------------------- |
| `entity`           | `string`        | —                           | Entity id (skip to use the main entity)              |
| `attribute`        | `string`        | —                           | Attribute key for the entity                         |
| `name`             | `string\|bool`  | `friendly_name`             | Override entity name (or `false` to hide)            |
| `unit`             | `string\|bool`  | `unit_of_measurement`       | Override entity unit (or `false` to hide)            |
| `hide_unavailable` | `bool`          | `false`                     | Hide if unavailable / not found                      |
| `hide_if`          | `object\|any`   | _[Hiding](#hiding)_         | Hide if value matches specified criteria             |
| `format`           | `string`        | _[Formatting](#formatting)_ | Format the value                                     |

---

## Actions

This card supports all standard HA actions on the main row. See [Lovelace Actions](https://www.home-assistant.io/lovelace/actions/) for the full reference.

| Option            | Type           | Default      | Description                                                                                |
| ----------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `action`          | `string`       | **required** | `more-info`, `toggle`, `call-service`, `url`, `navigate`, `fire-dom-event`, `none`         |
| `entity`          | `string`       | —            | Override entity id when `action` is `more-info`                                            |
| `service`         | `string`       | —            | Service to call when `action` is `call-service`                                            |
| `service_data`    | `object`       | —            | Optional data when `action` is `call-service`                                              |
| `url_path`        | `string`       | —            | URL when `action` is `url`                                                                 |
| `navigation_path` | `string`       | —            | Path when `action` is `navigate`                                                           |
| `confirmation`    | `bool\|object` | `false`      | Show a confirmation dialog                                                                 |
| `haptic`          | `string`       | `none`       | Haptic feedback (`success`, `warning`, `failure`, `light`, `medium`, `heavy`, `selection`) |

---

## Formatting

The `format` option supports:

| Value                   | Type        | Description                                                      |
| ----------------------- | ----------- | ---------------------------------------------------------------- |
| `relative`              | `timestamp` | Convert to relative time (`5 minutes ago`)                       |
| `total`                 | `timestamp` | Convert to relative duration (`5 minutes`)                       |
| `date`                  | `timestamp` | Convert timestamp to date                                        |
| `time`                  | `timestamp` | Convert timestamp to time                                        |
| `datetime`              | `timestamp` | Convert timestamp to date and time                               |
| `brightness`            | `number`    | Convert brightness value to percentage (0–255 → 0–100)           |
| `percent`               | `number`    | Multiply by 100 and append `%` (`0.85` → `85 %`) — new in 5.2.0  |
| `duration`              | `number`    | Convert seconds to duration (`5:38:50`)                          |
| `duration-m`            | `number`    | Convert milliseconds to duration                                 |
| `duration-h`            | `number`    | Convert hours to duration                                        |
| `invert`                | `number`    | Convert number from positive to negative or vice versa           |
| `kilo`                  | `number`    | Divide by 1000 (`1500 W` → `1.5 kW`)                             |
| `position`              | `number`    | Reverse a position percentage (`70%` open → `30%` closed)        |
| `precision0`–`precision9` | `number`  | Decimal precision (`precision3` → `18.123`)                      |
| `celsius_to_fahrenheit` | `number`    | Convert °C to °F                                                 |
| `fahrenheit_to_celsius` | `number`    | Convert °F to °C                                                 |
| `upper`                 | `string`    | Convert text to UPPERCASE — new in 5.2.0                         |
| `lower`                 | `string`    | Convert text to lowercase — new in 5.2.0                         |
| `capitalize`            | `string`    | Capitalize the first character — new in 5.2.0                    |
| `title`                 | `string`    | Capitalize Each Word ("Title Case") — new in 5.2.0               |

---

## Hiding

The `hide_if` option hides the entity if its state / attribute matches the specified criteria. Three forms:

```yaml
hide_if: 0                     # exact value
hide_if: [0, 'off']            # multiple values
hide_if:
  above: 100                   # range
  below: -10
  value: ['offline']           # plus exact matches
```

| Option      | Type        | Description                                                                       |
| ----------- | ----------- | --------------------------------------------------------------------------------- |
| `above`     | `number`    | Hide if numeric value is above the specified value                                |
| `below`     | `number`    | Hide if numeric value is below the specified value                                |
| `value`     | `list\|any` | Hide if value matches the specified value or any in a list                        |
| `entity`    | `string`    | Compare against another entity's state instead of the host entity (new in 5.2.0)  |
| `attribute` | `string`    | When combined with `entity`, compare against that entity's attribute              |

**Compare against another entity** — useful when one entity's visibility depends on a separate switch / sensor (e.g. only show the alarm exit-state when the alarm is armed):

```yaml
- entity: sensor.dsc_exit_state
  hide_if:
    entity: switch.dsc_armed_away
    value: 'off'                     # hide exit-state when the switch is OFF
```

> **Behaviour change in 5.2.0:** top-level `hide_if` and `hide_unavailable` now also apply to the **main row state slot** — symmetrical to per-entity behaviour. In 4.x they were silently ignored at the top level.

---

## Icon styling

Each entity (main + additional) supports three ways to control its icon:

- `icon` — pick a static MDI icon (`mdi:thermometer`) or set to `true` to use the entity's own attribute icon
- **`icon_color`** *(new in 5.2.0)* — any CSS color value applied as a CSS variable to the state-badge: `red`, `#ff4500`, `rgb(255, 100, 0)`, `var(--my-theme-color)`
- **`state_icon`** *(new in 5.2.0)* — map of state → icon path. Takes precedence over `icon` when the current state matches

```yaml
- type: custom:multiple-entity-row
  entity: cover.living_room_shutter
  icon_color: 'var(--accent-color)'
  state_icon:
    open: mdi:window-shutter-open
    closed: mdi:window-shutter
    opening: mdi:window-shutter-alert
  entities:
    - entity: binary_sensor.door
      icon_color: '#22c55e'        # green when displayed via icon: true
      icon: true
    - entity: light.bedroom
      state_icon:
        on: mdi:lightbulb
        off: mdi:lightbulb-off
```

In the visual editor, `icon_color` is a text field directly below the `icon` picker. `state_icon` lives in a small `<ha-code-editor>` block at the bottom of each entity tab, edited as YAML key:value pairs.

> **state_icon vs templating:** This is an explicit state-to-icon **map**, not a Jinja template. For full template expression support (e.g. `{% if states('sensor.foo') > 100 %}`), use card-mod or wait for a future templating phase.

---

## Custom CSS

The `styles` option attaches inline CSS to the rendered entity element. Available on the main row, on each entry in `entities[]`, and on the `secondary_info` object form.

```yaml
- entity: sensor.bedroom_temperature
  type: custom:multiple-entity-row
  name: Styles
  styles:
    width: 80px
    text-align: right
  secondary_info:
    attribute: battery_level
    styles:
      font-weight: bold
  entities:
    - entity: sensor.bedroom_max_temp
      styles:
        width: 80px
        text-align: left
```

> **Note:** This is the existing per-entity `styles` field. A card-mod-like mother-CSS injection is **not** planned for this card — keep custom styling scoped to the entities you need to adjust.

> **Using card_mod?** Multiple-entity-row has no `<ha-card>` of its own — entity-rows live inside the parent `entities`-card. Don't use `ha-card { ... }` selectors; target our shadow-DOM classes directly. The relevant ones:
>
> - `.entity` — every entity div (additional + main)
> - `.state.entity` — only the main state slot
> - `.entity span` — the small label above values
> - `.entity div` — the value below labels
> - `.entities-row` / `.entities-column` — the layout container
>
> For shadow-pierced sub-styling (e.g. into `<ha-entity-toggle>`'s inner `<ha-switch>`), card_mod's nested-selector + `$:` syntax works directly on the row config:
>
> ```yaml
> type: custom:multiple-entity-row
> entity: input_boolean.heating
> entities:
>   - entity: switch.heating_override
>     toggle: true
> card_mod:
>   style:
>     hui-generic-entity-row .entities-row div.entity:
>       ha-entity-toggle:
>         $: |
>           ha-switch {
>             padding-top: 5px !important;
>           }
> ```

---

## Examples

![multiple-entity-row](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/example.png)

### One entity

```yaml
- entity: sensor.bedroom_temperature
  type: custom:multiple-entity-row
  name: One entity
  secondary_info: last-changed
  entities:
    - sensor.bedroom_max_temp
```

### Multiple entities

```yaml
- entity: sensor.bedroom_temperature
  type: custom:multiple-entity-row
  name: Three entities
  secondary_info: last-changed
  entities:
    - entity: sensor.bedroom_humidity
      name: humidity
    - sensor.bedroom_min_temp
    - sensor.bedroom_max_temp
```

### Custom `secondary_info`

```yaml
- entity: sensor.bedroom_temperature
  type: custom:multiple-entity-row
  name: Custom secondary_info
  secondary_info:
    attribute: battery_level
    name: Battery
    unit: '%'
```

### Attributes from a single entity

```yaml
- entity: vacuum.xiaomi_vacuum_cleaner
  type: custom:multiple-entity-row
  name: Attributes
  entities:
    - attribute: battery_level
      name: Battery
      unit: '%'
    - attribute: status
      name: Status
```

### Hide labels

```yaml
- entity: sensor.bedroom_temperature
  type: custom:multiple-entity-row
  name: Hide labels
  entities:
    - entity: sensor.bedroom_min_temp
      name: false
    - entity: sensor.bedroom_max_temp
      name: false
```

### Toggles

```yaml
- entity: switch.livingroom_tv
  type: custom:multiple-entity-row
  name: Toggle
  toggle: true
  state_color: true
  entities:
    - entity: sensor.livingroom_tv_power
      name: Power
    - entity: sensor.livingroom_tv_power_total
      name: Total
```

### Icons with `tap_action`

```yaml
- entity: light.living_room
  type: custom:multiple-entity-row
  name: Icons with tap_action
  secondary_info: last-changed
  entities:
    - entity: light.living_room
      icon: mdi:palette
    - icon: mdi:lightbulb-off-outline
      state_color: true
      tap_action:
        action: call-service
        service: light.turn_off
        service_data:
          entity_id: light.living_room
    - icon: mdi:lightbulb-outline
      state_color: true
      tap_action:
        action: call-service
        service: light.turn_on
        service_data:
          entity_id: light.living_room
        confirmation:
          text: 'Are you sure?'
```

### Hide & format

```yaml
- entity: sensor.power_meter
  type: custom:multiple-entity-row
  name: Power
  entities:
    - entity: sensor.power_today
      name: Today
      format: kilo
      hide_if: 0
    - entity: sensor.power_total
      name: Total
      format: precision1
```

---

## Credits

Originally created by [@benct](https://github.com/benct) — see [benct/lovelace-multiple-entity-row](https://github.com/benct/lovelace-multiple-entity-row).

[hacs-badge]: https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=for-the-badge&logo=homeassistantcommunitystore&logoColor=white
[hacs-url]: https://hacs.xyz
[ha-badge]: https://img.shields.io/badge/Home%20Assistant-2024.4%2B-41BDF5.svg?style=for-the-badge&logo=homeassistant&logoColor=white
[ha-url]: https://www.home-assistant.io
[version-badge]: https://img.shields.io/github/v/release/duczz/ha-multiple-entity-row.svg?style=for-the-badge&logo=github&logoColor=white&color=22c55e
[downloads-badge]: https://img.shields.io/github/downloads/duczz/ha-multiple-entity-row/total.svg?style=for-the-badge&logo=github&logoColor=white&color=blueviolet
[release-url]: https://github.com/duczz/ha-multiple-entity-row
[license-badge]: https://img.shields.io/badge/license-MIT-94a3b8.svg?style=for-the-badge
