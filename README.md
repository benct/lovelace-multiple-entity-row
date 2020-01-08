# multiple-entity-row
Show multiple entity states or attributes on entity rows in Home Assistant's Lovelace UI

[![GH-release](https://img.shields.io/badge/version-2.0.0-red.svg?style=flat-square)](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
[![GH-last-commit](https://img.shields.io/github/last-commit/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row/commits/master)
[![GH-code-size](https://img.shields.io/github/languages/code-size/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)

## Setup

Install using [HACS](https://hacs.xyz/), or add [multiple-entity-row.js](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
to your `<config>/www/` folder and add the following to your `ui-lovelace.yaml` file:

```yaml
resources:
  - url: /local/multiple-entity-row.js?v=2.0.0
    type: module
```

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:multiple-entity-row`
| entity | string | **Required** | `domain.my_entity_id`
| name | string | | Override entity `friendly_name`
| unit | string | | Override entity `unit_of_measurement`
| icon | string | | Override entity `icon`
| toggle | bool | `false` | Display a toggle (if supported) instead of state
| hide_state | bool | `false` | Hide the entity state
| name_state | string | | Add name/header above the main entity state
| primary | object | *see below* | Primary additional entity object
| secondary | object | *see below* | Secondary additional entity object (not to be confused with `secondary_info`)
| tertiary | object | *see below* | Tertiary additional entity object (make sure there is enough room)
| info | object | *see below* | Additional entity object as `secondary_info`

### Entity objects (primary | secondary | tertiary | info*)

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | **Required** | A valid entity_id
| name | string/bool | | Override entity `friendly_name` (set to `false` to hide)
| unit | string | | Override entity `unit_of_measurement`
| attribute | string | | A valid attribute key for the specified entity
| toggle | bool | `false` | Display a toggle if supported by domain
| icon | string/bool | `false` | Display default or custom icon instead of state or attribute value
| service | string | | A valid service, including domain (e.g. `light.turn_on`)
| service_data | object | | Optional data to send together with `service`

\* The `info` object does not support `toggle`, `icon` or `service`

## Example

![multiple-entity-row](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/example.png)

```yaml
type: entities
title: multiple-entity-row
entities:
  - type: section
    label: Primary
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_max_temp

  - type: section
    label: Primary + Secondary
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_min_temp
    secondary:
      entity: sensor.bedroom_max_temp

  - type: section
    label: Info (secondary_info)
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_min_temp
    secondary:
      entity: sensor.bedroom_max_temp
    info:
      entity: sensor.bedroom_temperature
      attribute: battery_level
      name: Battery
      unit: '%'

  - type: section
    label: Attributes
  - entity: vacuum.vacuum_cleaner
    type: custom:multiple-entity-row
    primary:
      entity: vacuum.vacuum_cleaner
      attribute: battery_level
      name: Battery
      unit: '%'
    secondary:
      entity: vacuum.vacuum_cleaner
      attribute: status
      name: Status

  - type: section
    label: Toggle
  - entity: switch.livingroom_tv
    type: custom:multiple-entity-row
    toggle: true
    primary:
      entity: sensor.livingroom_tv_power
    secondary:
      entity: sensor.livingroom_tv_power_total

  - type: section
    label: Hide state
  - entity: switch.livingroom_tv
    type: custom:multiple-entity-row
    hide_state: true
    primary:
      entity: sensor.livingroom_tv_power
    secondary:
      entity: sensor.livingroom_tv_power_2

  - type: section
    label: Hide name
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_min_temp
      name: false
    secondary:
      entity: sensor.bedroom_max_temp
      name: false

  - type: section
    label: Customization
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Custom Name
    icon: mdi:fire
    unit: °F
    secondary_info: last-changed
    primary:
      name: custom name
      entity: sensor.bedroom_max_temp
      unit: temp
```

## My cards

[xiaomi-vacuum-card](https://github.com/benct/lovelace-xiaomi-vacuum-card) | 
[multiple-entity-row](https://github.com/benct/lovelace-multiple-entity-row) | 
[github-entity-row](https://github.com/benct/lovelace-github-entity-row) | 
[~~attribute-entity-row~~](https://github.com/benct/lovelace-attribute-entity-row)

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoff.ee/benct)
