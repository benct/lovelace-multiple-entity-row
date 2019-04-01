# multiple-entity-row
Show multiple entity states on entity rows in Home Assistant's Lovelace UI

### Setup

Add [multiple-entity-row.js](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js) to your `<config>/www/` folder. Add the following to your `ui-lovelace.yaml` file:

```yaml
resources:
  - url: /local/multiple-entity-row.js
    type: js
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
