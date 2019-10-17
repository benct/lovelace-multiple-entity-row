# multiple-entity-row
Show multiple entity states or attributes on entity rows in Home Assistant's Lovelace UI

[![GH-release](https://img.shields.io/badge/version-1.2.4-red.svg?style=flat-square)](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
[![GH-last-commit](https://img.shields.io/github/last-commit/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row/commits/master)
[![GH-code-size](https://img.shields.io/github/languages/code-size/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/custom-components/hacs)

## Setup

Add [multiple-entity-row.js](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js) to your `<config>/www/` folder. Add the following to your `ui-lovelace.yaml` file:

```yaml
resources:
  - url: /local/multiple-entity-row.js?v=1.2.4
    type: js
```

### *(Optional)* Add to custom updater

1. Make sure you have the [custom_updater](https://github.com/custom-components/custom_updater) component installed and working.

2. Add a new reference under `card_urls` in your `custom_updater` configuration in `configuration.yaml`.

```yaml
custom_updater:
  card_urls:
    - https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/tracker.json
```

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:multiple-entity-row`
| entity | string | **Required** | `domain.my_entity_id`
| name | string | | Override entity `friendly_name`
| unit | string | | Override entity `unit_of_measurement`
| icon | string | | Override entity `icon`
| toggle | bool | `false` | Display a toogle instead of state
| hide_state | bool | `false` | Hide the entity state
| primary | object | *see below* | Primary additional entity object
| secondary | object | *see below* | Secondary additional entity object (not to be confused with `secondary_info`)
| tertiary | object | *see below* | Tertiary additional entity object (make sure there is enough room)
| info | object | *see below* | Additional entity object as `secondary_info`

### Entity objects (primary | secondary | tertiary | info)

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | **Required** | A valid entity_id
| name | string/bool | | Override entity `friendly_name` (set to `false` to hide)
| unit | string | | Override entity `unit_of_measurement`
| attribute | string | | A valid attribute key for the specified entity

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
[github-entity-row](https://github.com/benct/lovelace-github-entity-row) | 
[multiple-entity-row](https://github.com/benct/lovelace-multiple-entity-row) | 
[attribute-entity-row](https://github.com/benct/lovelace-attribute-entity-row)

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoff.ee/benct)
