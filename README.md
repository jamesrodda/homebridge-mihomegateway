# homebridge-mihomegateway

Energenie MiHome gateway plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation

1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-mihomegatewat`
3. Update your configuration file. See the sample below.

# Updating

- `npm update -g homebridge-mihomegateway`

# Configuration

## Sample Configuration

```json
"accessories": [{
    "accessory": "MiHomeGateway",
    "name": "",
    "username": "",
    "api_key": "",
    "device_id": ""
}]
```

## TODO
1. List all subdevices on gateway
1. Convert to a platform
2. Accept password for initial authentication or api key directly
