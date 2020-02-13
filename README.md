# multiple-entity-row
Show multiple entity states or attributes on entity rows in Home Assistant's Lovelace UI

[![GH-release](https://img.shields.io/badge/version-2.3.0-red.svg?style=flat-square)](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
[![GH-last-commit](https://img.shields.io/github/last-commit/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row/commits/master)
[![GH-code-size](https://img.shields.io/github/languages/code-size/benct/lovelace-multiple-entity-row.svg?style=flat-square)](https://github.com/benct/lovelace-multiple-entity-row)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=flat-square)](https://github.com/custom-components/hacs)

## Setup

Manually add [multiple-entity-row.js](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/multiple-entity-row.js)
to your `<config>/www/` folder and add the following to your `ui-lovelace.yaml` file:
```yaml
resources:
  - url: /local/multiple-entity-row.js?v=2.3.0
    type: module
```

OR install using [HACS](https://hacs.xyz/) and add this instead:
```yaml
resources:
  - url: /community_plugin/lovelace-multiple-entity-row/multiple-entity-row.js
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
| name_state | string | | Show name/header above the main entity state
| state_color | bool | `false` | Enable colored icon when entity is active
| | | |
| entities | list | *see below* | Additional entity IDs or entity object(s)
| secondary_info | string/object | *see below* | Custom `secondary_info` entity object

### Entity Objects

Either `entity`, `attribute` or `service` needs to be specified. `entity` is only required if you want to display data from another entity
than the main entity specified above. `attribute` is necessary if you want to display an entity attribute value instead of the state
value. `service` lets you call a specified service on click instead of showing the more-info dialog (works well together with `icon`).

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | | A valid entity_id (or skip to use main entity)
| attribute | string | | A valid attribute key for the entity
| name | string/bool | `friendly_name` | Override entity `friendly_name`, or `false` to hide
| unit | string | `unit_of_measurement` | Override entity `unit_of_measurement`
| toggle | bool | `false` | Display a toggle if supported by domain
| icon | string/bool | `false` | Display default or custom icon instead of state or attribute value
| service | string | | A valid service, including domain (e.g. `light.turn_on`)
| service_data | object | | Optional data to send together with `service`

### Secondary Info

The `secondary_info` field can either be the string `last-changed` or an object containing the following configuration:

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entity | string | | A valid entity_id (or skip to use main entity)
| attribute | string | | A valid attribute key for the entity
| name | string/bool | `friendly_name` | Override entity `friendly_name`, or `false` to hide
| unit | string | `unit_of_measurement` | Override entity `unit_of_measurement`


## Examples

![multiple-entity-row](https://raw.githubusercontent.com/benct/lovelace-multiple-entity-row/master/example.png)

```yaml
type: entities
entities:
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: One entity
    secondary_info: last-changed
    entities:
      - sensor.bedroom_max_temp

  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Two entities
    secondary_info: last-changed
    entities:
      - sensor.bedroom_min_temp
      - sensor.bedroom_max_temp

  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Three entities
    secondary_info: last-changed
    entities:
      - entity: sensor.bedroom_humidity
        name: humidity
      - sensor.bedroom_min_temp
      - sensor.bedroom_max_temp

  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Custom secondary_info
    secondary_info:
      attribute: battery_level
      name: Battery
      unit: '%'

  - type: section
  - entity: vacuum.xiaomi_vacuum_cleaner
    type: custom:multiple-entity-row
    name: Attributes
    entities:
      - attribute: battery_level
        name: Battery
        unit: '%'
      - attribute: status
        name: Status

  - entity:  sensor.lovelace_multiple_entity_row
    type: custom:multiple-entity-row
    name: Attributes (hide_state)
    hide_state: true
    entities:
      - attribute: stargazers
        name: Stars
      - attribute: open_issues
        name: Issues
      - attribute: open_pull_requests
        name: PRs

  - type: section
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Hide names
    entities:
      - entity: sensor.bedroom_min_temp
        name: false
      - entity: sensor.bedroom_max_temp
        name: false

  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Main state name
    name_state: current
    entities:
      - sensor.bedroom_min_temp
      - sensor.bedroom_max_temp

  - type: section
  - entity: switch.livingroom_tv
    type: custom:multiple-entity-row
    name: Toggle
    toggle: true
    entities:
      - entity: sensor.livingroom_tv_power
        name: Power
      - entity: sensor.livingroom_tv_power_total
        name: Total

  - entity: switch.livingroom_tv
    type: custom:multiple-entity-row
    name: Multiple toggles
    name_state: main
    toggle: true
    entities:
      - entity: switch.livingroom_light
        name: toggle1
        toggle: true
      - entity: switch.livingroom_light_2
        name: toggle2
        toggle: true

  - type: section
  - entity: sensor.bedroom_temperature
    type: custom:multiple-entity-row
    name: Customization
    icon: mdi:fire
    unit: °F
    secondary_info: last-changed
    entities:
      - entity: sensor.bedroom_max_temp
        name: custom name
        unit: temp

  - type: section
  - entity: sensor.living_room_temperature
    type: custom:multiple-entity-row
    name: Icons (service calls)
    secondary_info: last-changed
    entities:
      - entity: light.living_room
        icon: mdi:palette
      - icon: mdi:lightbulb-off-outline
        service: light.turn_off
        service_data:
          entity_id: light.living_room
      - icon: mdi:lightbulb-outline
        service: light.turn_on
        service_data:
          entity_id: light.living_room
```

## My cards

[xiaomi-vacuum-card](https://github.com/benct/lovelace-xiaomi-vacuum-card) | 
[multiple-entity-row](https://github.com/benct/lovelace-multiple-entity-row) | 
[github-entity-row](https://github.com/benct/lovelace-github-entity-row) | 
[~~attribute-entity-row~~](https://github.com/benct/lovelace-attribute-entity-row)

[![BMC](https://www.buymeacoffee.com/assets/img/custom_images/white_img.png)](https://www.buymeacoff.ee/benct)
