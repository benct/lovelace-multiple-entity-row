# Changelog
All notable changes to this project will be documented in this file.

## 3.1.0

- **Changed:** Display name/header above additional entity icons (#41)
- **Added:** Support `state_color` config on additional entity icons (#45)
- **Added:** Haptic feedback on `call-service` and `toggle` actions (#44)
- **Added:** Support entity override on `more-info` action (#46)
- **Added:** Support `confirmation` dialog config on `tap_action` (#42)
- **Added:** Support `url` action config on `tap_action` (#49)
- **Added:** Support `none` action config on `tap_action` (#53)
- **Added:** Support any string value as `secondary_info` (#51)
- **Added:** Support `format` config for date/time values (#43, #47)

## 3.0.0

Several main configuration options have been changed to better match the default Lovelace cards, as listed below.
See [README](README.md) for more info and examples on all possible breaking configuration changes.

- **Changed:** Convert additional entity config to `entities` list instead of named objects (#28)
- **Changed:** Merge `info` into `secondary_info` for simpler configuration
- **Changed:** Rename `hide_state` to `show_state` with default `true`
- **Changed:** Rename `name_state` to `state_header`
- **Changed:** Move service call configuration to `tap_action` (#31)
- **Added:** Support custom `tap_action` for main entity (#31)
- **Added:** Support for `more_info`, `toggle` and `call_service` actions under `tap_action` (#32)
- **Added:** Additional entity icons change color based on entity state (#25)

## 2.3.0

- **Added:** Support `state_color` config introduced in HA v0.105 (#36)
- **Fixed:** Minor incorrect code syntax

## 2.2.1

- **Fixed:** Info name showing as `null` when disabled (#27)

## 2.2.0

- **Changed:** More refactoring and cleanup of code
- **Changed:** Make `entity` optional on additional entity objects (#23)

## 2.1.0

- **Added:** Support for calling services on entity click (#6)
- **Fixed:** Issue where LitElement has already been declared (#21)

## 2.0.0

- **Changed:** Major refactoring and cleanup of code
- **Changed:** Use LitElement instead of Polymer.Element
- **Added:** Support for HA Cast [https://cast.home-assistant.io](https://cast.home-assistant.io) (#20)
- **Added:** Support for displaying icons for additional entities (#19)
- **Fixed:** Incorrect toggle state on climate entities (#18)

## 1.4.1

- **Added:** Default row click-handler, after it was [removed](https://github.com/home-assistant/home-assistant-polymer/pull/4023) in HA v0.101 (#16)

## 1.4.0

- **Added:** Toggle-support for additional entities (#15)
- **Changed:** Refactor and improve code

## 1.3.0

- **Added:** Support for an optional tertiary object (#15)
- **Added:** Optional name/header above the main entity state (#15)
- **Fixed:** Attribute showing as unavailable when falsy (#13)

## 1.2.4

- **Fixed:** Incorrect toggle state when unavailable (#8)

## 1.2.3

- **Fixed:** Not possible to hide entity unit value (#7)

## 1.2.2

- **Fixed:** Entity state values not updating correctly (#4)

## 1.2.1

- **Fixed:** Missing entity state values (#3)

## 1.2.0

- **Added:** Support for custom entity/attribute as secondary_info
- **Added:** Card as default plugin in [HACS](https://github.com/custom-components/hacs)
- **Changed:** Refactor and improve code

## 1.1.0

- **Added:** More-info dialog on click on additional entities
- **Added:** Support for custom_updater component
- **Fixed:** Badge link in README

## 1.0.0

- **Initial release**
