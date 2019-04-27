# multiple-entity-row
Show multiple entity states on entity rows in Home Assistant's Lovelace UI

[![GH-release](https://img.shields.io/badge/version-1.0.0-red.svg?style=flat-square)](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
[![GH-last-commit](https://img.shields.io/github/last-commit/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row/commits/master)
[![GH-code-size](https://img.shields.io/github/languages/code-size/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row)

### Setup

Add [multiple-entity-row.js](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js) to your `<config>/www/` folder. Add the following to your `ui-lovelace.yaml` file:

```yaml
resources:
  - url: /local/multiple-entity-row.js?v=1.0.0
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

### Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:multiple-entity-row`
| entity | string | **Required** | `domain.my_entity_id`
| name | string | | Override entity friendly_name
| unit | string | | Override entity unit_of_measurement
| icon | string | | Override entity icon
| toggle | bool | false | Display a toogle instead of state
| hide_state | bool | false | Hide the entity state
| primary | object | | Primary additional entity object
| secondary | object | | Secondary additional entity object

Primary/secondary object:

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | **Required** | A valid entity_id
| name | string/bool | | Override entity friendly_name (use `false` to hide)
| unit | string | | Override entity unit_of_measurement
| attribute | string | | A valid attribute key for the specified entity

### Example

![multiple-entity-row](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/example.png)

```yaml
type: entities
title: multiple-entity-row
entities:
  - type: section
    label: Single
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_max_temp

  - type: section
    label: Both
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    primary:
      entity: sensor.bedroom_min_temp
    secondary:
      entity: sensor.bedroom_max_temp

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

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoff.ee/benct)
