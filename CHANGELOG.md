# Changelog
All notable changes to this project will be documented in this file.

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
