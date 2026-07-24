# Changelog
All notable changes to this project will be documented in this file.

## 4.8.0

**Added:**
- Jinja templating, rendered server-side by Home Assistant and updated live as referenced entities change. Supported in `name`, `icon`, `icon_color`, `secondary_info` text, `hide_if` (string form or `hide_if.template`), and a new `template:` option that replaces the displayed value; each template gets an `entity` variable holding the owning entity id (#409, #35, #249, #278, #247, #254, #269, #270)
- Templated configs open directly in the code editor - the visual editor can't round-trip Jinja safely

**Fixed:**
- `unit:` overrides (including `unit: false`) ignored on state values of entities whose integration ships translated units, e.g. Analytics Insights - the card now formats overridden values itself, keeping locale formatting and the display-precision setting (#413)

## 4.7.1

**Fixed:**
- Row could stay permanently blank when the first `hass` update arrived in a later render batch than the config - the likely cause of long-standing intermittent blank rows (#389, #400 diagnosis)
- Rows with `%` entities clipping on narrow/mobile screens instead of wrapping - regression from the 4.6.0 switch to HA-native formatting (#403)
- `unit:` overrides (including `unit: false`) were ignored when displaying an attribute - same regression family (#408)
- `format:` timestamp options (`time`, `datetime`, ...) were silently ignored on the `last-changed`/`last-updated` attributes (#221, #305)
- `default:` on a hidden/missing entity now resolves its header like a visible entity (friendly-name fallback) instead of requiring an explicit `name:` (#302)
- `confirmation:` on `tap_action` now gates `toggle: true` toggles instead of being bypassed (#265)
- A `name: false` entity (and the header-less main state) now aligns its value with headered siblings instead of floating centered (#281)

## 4.7.0

**Breaking:**
- Minimum Home Assistant version is now **2024.4** (declared in `hacs.json`). The pre-2023.9 state/attribute formatting fallback chain was removed - the row now always delegates to `hass.formatEntityState`/`hass.formatEntityAttributeValue`, matching HA's own display formatting.

**Added:**
- Visual config editor - tabbed main/additional entities with add/reorder/copy/paste/delete, secondary info modes, state-based icons, per-entity custom CSS, and action selectors (#395)
- `hold_action` and `double_tap_action` on additional entities; all actions resolve against the entity actually tapped (#338, #202, #188, #251)
- Combinable numeric formats: comma-separated pipelines like `format: invert, precision3`, with a Custom… entry in the editor (#385)
- `hide_if.entity` / `hide_if.attribute` - evaluate hide criteria against another entity's state or attribute (#280, thanks @akomelj)
- `icon_color` - any CSS color for entity icons (#325)
- `state_icon` - map of state value to icon override (#197)
- `show_state_first` - render the main state before the additional entities (#384)
- `percent` format (#323) and `upper`/`lower`/`capitalize`/`title` string formats (#367)
- `--multiple-entity-row-header-color` theme variable (#317, thanks @ildar170975)

**Changed:**
- Actions dispatch through HA core via the `hass-action` event: native confirmation dialogs and lock/cover security restrictions now apply; the unmaintained `custom-card-helpers` dependency is removed
- A long-press without a `hold_action` acts as a plain tap, matching HA's native rows (previously opened more-info)
- Sub-entity taps no longer also fire the main row's action
- Top-level `hide_if` / `hide_unavailable` now hide the main state value (previously silently ignored) (#227)
- Internal: incremental TypeScript migration begun; new code is TypeScript

**Fixed:**
- Uncaught `RangeError` when typing an incomplete `precision`/`kilo`/`mega`/`milli` format in the config editor (#387)

Several features adapted from the [duczz/ha-multiple-entity-row](https://github.com/duczz/ha-multiple-entity-row) fork - thanks @duczz.

## 4.6.1

**Fixed:**
- HA 2026.7+'s entities-card row editor silently renames a row's `format` key to `time_format` on save, breaking `format:` for the main entity - `multiple-entity-row` now falls back to `time_format` when `format` isn't set (#386)

**Changed:**
- Internal: console banner now includes a build timestamp and short git commit SHA, to make it easier to tell a stale cached bundle apart from a fresh one when debugging

## 4.6.0

**Added:**
- `mega<0-9>` and `milli<0-9>` number formats, and `kilo<0-9>` for an explicit decimal precision override (`kilo` alone is unchanged) (#304)

**Fixed:**
- `name` override not applying on the main row on HA 2026.2+ until an unrelated entity update forced a re-render (#370, #371)
- `format: duration`/`duration-m`/`duration-h` showing the literal string "null" for a zero-second value (#240)
- Numeric formats (brightness, precision, kilo, invert, position, celsius/fahrenheit conversion) showing the literal string "undefined" for a missing attribute (#225)
- `invert`/`position` formats losing decimal precision compared to the unformatted value (#304)
- Decimal/currency/precision formatting now delegates to Home Assistant's own official formatting functions when available (HA 2023.9+), fixing a cluster of long-standing formatting bugs (#333, #308, #286, #220, #375, #363, #357, #320)
- Console spammed with errors for monetary sensors using a non-currency unit like "c/kWh" (#324)
- Missing-attribute display showing "undefined" on older HA versions without the official formatting functions

**Changed:**
- Internal: added a real test suite (100+ tests), CI, and automated release tooling - the built JS file is no longer manually committed per release
- Internal: bumped `lit` (2->3) and `custom-card-helpers` (1.8->2.0), bundled into the built file, no action needed
- Internal: fixed 57 known vulnerabilities (4 critical) in the dev/build toolchain

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
