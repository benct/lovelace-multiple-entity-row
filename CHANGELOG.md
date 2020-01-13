# Changelog
All notable changes to this project will be documented in this file.

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
