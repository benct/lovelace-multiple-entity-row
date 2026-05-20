# Changelog
All notable changes to this project will be documented in this file.

## 5.2.0 — 2026-05-20

> **First modernised release.** Stack modernisation + visual editor + upstream bug-sweep + per-entity icon styling (`icon_color`, `state_icon`). Versions `5.0.0` and `5.1.0` were intentionally skipped — everything ships together. **No schema changes** — all existing 4.x YAML configs continue to work unchanged.

> ⚠️ **Behaviour-change heads-up:** `hold_action` and `double_tap_action` on the main row, as well as top-level `hide_if` / `hide_unavailable`, all start firing in 5.2.0 if they were set in YAML. They were silently no-ops in 4.x. If you had any of these in your config "just in case", review them before upgrading.

### Stack (modernisation)
- Migrated from **Lit 2.7 → Lit 3.2**
- Migrated from **JavaScript + Babel → TypeScript 5.7** with `strictNullChecks`
- Build switched from **Webpack 5 → Rollup 4**
- Package manager switched from **yarn → npm**
- Removed deprecated `custom-card-helpers` dependency
- `src/lib/*` (HA-internal copies from 2020) replaced with `hass.formatEntityState`, `hass.formatEntityAttributeValue`, `hass.localize`, and `Intl.NumberFormat` — locale-aware out of the box
- Bundle output moved from repo root to `dist/multiple-entity-row.js` (modern HACS layout)
- `customCards` registration entry added (improves discovery in third-party tools)
- Double-registration guard against duplicate `customElements.define` (HACS + manual resource)
- Build-time injection (`BUILD_TIME`) surfaced in the editor footer for HACS cache diagnostics

### Visual editor (new)
- `<ha-form>`-based, using Home Assistant's native form renderer
- **Tab-based layout**: a single `Entities` panel with `<ha-tab-group>`; tab `1` is the main entity, tabs `2+` are the `entities[]` list with add / cut / copy / paste / move / delete buttons
- **Secondary info polymorphic editor**: switch between None / Custom text / HA built-in token (`last-changed`, …) / Entity-based without losing context
- **Custom CSS per entity**: `<ha-code-editor mode="yaml">` block at the bottom of every tab; edits round-trip into the per-entity `styles:` field
- **Interactions panel**: tap / hold / double-tap action selectors for the main row
- **Cross-row clipboard** for entity sub-configs (sessionStorage-scoped to the browser tab)
- "Copy Main as template" — duplicates Main's per-entity-relevant fields as a clipboard entry, useful to seed similar additional entities

### Fixed (upstream issues closed)
- **`name` override not appearing on initial paint in HA 2026.2+** — re-render now also triggers on `hass.formatEntityName` reference change ([upstream PR #373](https://github.com/benct/lovelace-multiple-entity-row/pull/373), [#370](https://github.com/benct/lovelace-multiple-entity-row/issues/370), [#371](https://github.com/benct/lovelace-multiple-entity-row/issues/371))
- **`hold_action` / `double_tap_action` silently dead** — both were accepted in YAML but the 4.x runtime called `handleClick(..., false, false)`, so they never fired. Now wired via local pointer-event handlers ([#338](https://github.com/benct/lovelace-multiple-entity-row/issues/338), [#309](https://github.com/benct/lovelace-multiple-entity-row/issues/309), [#202](https://github.com/benct/lovelace-multiple-entity-row/issues/202), [#334](https://github.com/benct/lovelace-multiple-entity-row/issues/334))
- **`hide_if` / `hide_unavailable` ignored on main row** — top-level hide rules now apply to the main state slot, symmetrical to per-entity behaviour ([#227](https://github.com/benct/lovelace-multiple-entity-row/issues/227))
- **`tap_action: { action: more-info, entity: X }` ignored the entity override** — main row now opens the named entity instead of the host row ([#188](https://github.com/benct/lovelace-multiple-entity-row/issues/188))
- **`hide_if.entity` named-entity comparison** — `hide_if` may now reference another entity / attribute to evaluate against ([upstream PR #280](https://github.com/benct/lovelace-multiple-entity-row/pull/280))
- **Number formatting respects locale / decimal settings** — replaced custom formatter with `hass.formatEntityState` and `Intl.NumberFormat` ([#220](https://github.com/benct/lovelace-multiple-entity-row/issues/220), [#286](https://github.com/benct/lovelace-multiple-entity-row/issues/286), [#363](https://github.com/benct/lovelace-multiple-entity-row/issues/363))
- **`brightness` undefined when entity is unavailable** — guarded by `isUnavailable` check before the format pipeline ([#225](https://github.com/benct/lovelace-multiple-entity-row/issues/225))
- **`format: duration` returned `null` for value `0`** — `secondsToDuration` now returns `"0"` ([#240](https://github.com/benct/lovelace-multiple-entity-row/issues/240))

### Fixed (deep-dive review)
- **`hide_if.entity` references not re-render-tracked** — `getEntityIds` now picks up entity refs out of object-form `hide_if` so the row re-renders when the referenced entity changes
- **Pointer timers could leak after disconnect** — added `disconnectedCallback` that clears in-flight hold / double-tap timers
- **Empty entity object `{}` could crash the runtime** — `checkEntity` now permits empty placeholder objects (kept by the editor between "+" and the first edit); the runtime silently skips rendering them
- **Toggle not visually centered with the label above** — added `.entity ha-entity-toggle { display: inline-block }` so `text-align: center` on the parent zentriert den Switch jetzt korrekt

### Added (new format modes)
- `percent` — value × 100 with `%` unit appended ([#323](https://github.com/benct/lovelace-multiple-entity-row/issues/323))
- `upper`, `lower`, `capitalize`, `title` — string-transform formats ([#367](https://github.com/benct/lovelace-multiple-entity-row/issues/367))

### Added (per-entity icon styling)
- **`icon_color`** — any CSS color value (`red`, `#ff0000`, `var(--my-color)`) applied to the entity's icon via CSS variables. Works on both the main row and additional entities ([upstream #325](https://github.com/benct/lovelace-multiple-entity-row/issues/325))
- **`state_icon`** — map of state → icon path (`state_icon: { on: mdi:door-open, off: mdi:door-closed }`). Takes precedence over `icon` when the current state matches. No templating — explicit map only ([upstream #197](https://github.com/benct/lovelace-multiple-entity-row/issues/197))

### Added (accessibility)
- Fallback tab buttons now expose `aria-controls` + the tab panel has `role="tabpanel"` so screen readers can navigate the entities-tab-group correctly even on HA versions without native `<ha-tab-group>`

### Changed
- Minimum Home Assistant version is now **2024.4+** (uses `hass.formatEntityState` and `hass.performAction`)

### Notes
- `5.0.0` and `5.1.0` were intentionally skipped — modernisation, editor, upstream sweep, deep-dive review, and per-entity icon styling all ship together in `5.2.0`
- Format `precision4`..`precision9` still work in YAML but are no longer in the editor's `format` dropdown to keep the UI tidy. `precision0`..`precision3` cover the common cases.
- The runtime accepts empty object placeholders in `entities[]` but they don't render; the editor uses them as in-progress slots when you click "+" before filling the form.

## 4.5.1

**Fixed:**
- Incorrect state icons for HA 2024.2+ (#330, #331)

## 4.5.0

**Added:**
- Support default value for missing/hidden entity (#241)
- Fahrenheit to celsius and celsius to fahrenheit formatter (#243)
- Formatting option for duration as hours `duration-h` (#263)
- Support state object attributes as formatting values (#267)

**Changed:**
- Support new translation_key for entity states (#289, #290, #293)

**Fixed:**
- Rendering of secondary info with last-changed/updated attributes (#222)

## 4.4.1

**Fixed:**
- Incorrect usage of timestamp formats array (#219)
- Missing number formatting on `position` and `invert` options (#220)

## 4.4.0

**Added:**
- Support `last-changed` and `last-updated` states on additional entities (#101)
- Support hiding entities based on specific value(s) or criteria (#218)
- Formatting options `position`, `invert`, `kilo` and `duration-m` (#135, #151, #174)

**Changed:**
- Replace outdated functionality from `custom-cards` with updated equivalents

**Fixed:**
- Date/time inputs not respecting selected time format (#189)

## 4.3.2

**Fixed:**
- Incorrect triggering of `more-info` dialog on mobile devices (#217)

## 4.3.1

**Fixed:**
- Use correct locale field on entity value formatting (#212)

## 4.3.0

**Added:**
- Support hiding main entity name with `name: false` (#131, #134, #179)
- Locale-aware number formatting of all entity values (#149, #162, #208, #212)

**Changed:**
- Bundle `Lit` in card rather than importing from HA (#192)
- Simplify and improve handling of entity state display

**Fixed:**
- Incorrect triggering of `more-info` dialog when clicking additional entities (#216, #217)

## 4.2.0

**Added:**
- Support `fire-dom-event` custom action (#173)
- Support haptic feedback configuration on actions (#164)
- Support custom entity on `more-info` action (#161)

**Changed:**
- Use localization on `attribute` values (#178)
- Render disabled toggles on unavailable state (#160)
- Improve state display of `input_dateime` entities (#140)

**Fixed:**
- Incorrect rendering of `unit` when `false` (#145)

## 4.1.1

**Fixed:**
- Incorrect handling of datetime string values (#142)

## 4.1.0

**Added:**
- Handle non-numeric values when using `format` option (#127)
- Support `brightness` as a formatting option (#128)
- Support `hide_unavailable` option on secondary info objects (#136)

## 4.0.0

This release includes a major refactoring of the codebase, but should not contain any (significant) breaking changes.
Please report any bugs or issues [here](https://github.com/benct/lovelace-multiple-entity-row/issues).

**Added:**
- Support showing `attribute` instead of state on main entity (#124)
- Support all standard HA `secondary_info` options (#113, #123)
- Support standard `image` option for entity row (#114)
- Support `hold_action` and `double_tap_action` (on entity row only) (#50)
- Prevent unnecessary re-rendering with `shouldUpdate` function (#125)
- Option `hide_unavailable` now also supports attributes (#119)
- Several external packages and tools to improve developer experience

**Changed:**
- Major refactoring and improvements of entire codebase
- Use `hui-generic-entity-row` to handle generic parts of row
- Move CSS and utility functions to separate files
- Replace some utility methods with equivalents from `custom-card-helpers`
- Simplify most configuration handling

**Removed:**
- Custom styles option on secondary info

## 3.5.1

**Fixed:**
- Unit not being rendered when `format` option is set (#117)

## 3.5.0

**Added:**
- Support custom styling on state and entity objects (#111, #112)
- Format option `precision<0-9>` for value decimal precision (#110)
- Option `hide_unavailable` to hide entity if unavailable (#77)

**Fixed:**
- Secondary info name not being rendered when `format` option is set (#60)
- Call correct service when toggling `lock` or `cover` entity (#32)

## 3.4.0

**Added:**
- Format option `duration` for displaying value in seconds as `hh:mm:ss` (#89)
- Display `hui-warning` element when main entity is not available

**Changed:**
- Row tap action now affects entire row, not only state value (#107)
- Simplify and improve tap action handling
- Remove deprecated handling of zwave state values

## 3.3.0

**Added:**
- Support `navigate`action with `navigate_path` on tap actions (#66, #82)
- Support for showing entities in a `column` instead of the default row (#98)
- Print version information to browser console window (#78)

**Changed:**
- Improved alignment on state element by removing min-width (#64)
- Tap action mode `url` now behaves similarly as other HA cards (#66)

## 3.2.1

**Fixed:**
- Compatibility issues with HA `0.116` (#103, #104)

## 3.2.0

**Fixed:**
- State display for entities with `device_class` (#74)
- Default HA icon when state attribute icon is undefined (#71)

## 3.1.1

**Fixed:**
- Remove unsupported optional chaining operator (#54, #56, #57)

## 3.1.0

**Changed:**
- Display name/header above additional entity icons (#41)

**Added:**
- Support `state_color` config on additional entity icons (#45)
- Haptic feedback on `call-service` and `toggle` actions (#44)
- Support entity override on `more-info` action (#46)
- Support `confirmation` dialog config on `tap_action` (#42)
- Support `url` action config on `tap_action` (#49)
- Support `none` action config on `tap_action` (#53)
- Support any string value as `secondary_info` (#51)
- Support `format` config for date/time values (#43, #47)

## 3.0.0

Several main configuration options have been changed to better match the default Lovelace cards, as listed below.
See [README](README.md) for more info and examples on all possible breaking configuration changes.

**Changed:**
- Convert additional entity config to `entities` list instead of named objects (#28)
- Merge `info` into `secondary_info` for simpler configuration
- Rename `hide_state` to `show_state` with default `true`
- Rename `name_state` to `state_header`
- Move service call configuration to `tap_action` (#31)

**Added:**
- Support custom `tap_action` for main entity (#31)
- Support for `more_info`, `toggle` and `call_service` actions under `tap_action` (#32)
- Additional entity icons change color based on entity state (#25)

## 2.3.0

**Added:**
- Support `state_color` config introduced in HA v0.105 (#36)

**Fixed:**
- Minor incorrect code syntax

## 2.2.1

**Fixed:**
- Info name showing as `null` when disabled (#27)

## 2.2.0

**Changed:**
- More refactoring and cleanup of code
- Make `entity` optional on additional entity objects (#23)

## 2.1.0

**Added:**
- Support for calling services on entity click (#6)

**Fixed:**
- Issue where LitElement has already been declared (#21)

## 2.0.0

**Changed:**
- Major refactoring and cleanup of code
- Use LitElement instead of Polymer.Element

**Added:**
- Support for HA Cast [https://cast.home-assistant.io](https://cast.home-assistant.io) (#20)
- Support for displaying icons for additional entities (#19)

**Fixed:**
- Incorrect toggle state on climate entities (#18)

## 1.4.1

**Added:**
- Default row click-handler, after it was [removed](https://github.com/home-assistant/home-assistant-polymer/pull/4023) in HA v0.101 (#16)

## 1.4.0

**Changed:**
- Refactor and improve code

**Added:**
- Toggle-support for additional entities (#15)

## 1.3.0

**Added:**
- Support for an optional tertiary object (#15)
- Optional name/header above the main entity state (#15)

**Fixed:**
- Attribute showing as unavailable when falsy (#13)

## 1.2.4

**Fixed:**
- Incorrect toggle state when unavailable (#8)

## 1.2.3

**Fixed:**
- Not possible to hide entity unit value (#7)

## 1.2.2

**Fixed:**
- Entity state values not updating correctly (#4)

## 1.2.1

**Fixed:**
- Missing entity state values (#3)

## 1.2.0

**Changed:**
- Refactor and improve code

**Added:**
- Support for custom entity/attribute as secondary_info
- Card as default plugin in [HACS](https://github.com/custom-components/hacs)

## 1.1.0

**Added:**
- More-info dialog on click on additional entities
- Support for custom_updater component

**Fixed:**
- Badge link in README

## 1.0.0

- **Initial release**
