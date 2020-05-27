<p align="center">
  <img src="branding/mihome-logo.png" width="100">
  <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>

# MiHome Gateway Platform Plugin
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

Energenie MiHome gateway plugin for [Homebridge](https://github.com/nfarina/homebridge).

# Installation
1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-mihomegateway`
3. Update your configuration file. See the sample below.

# Updating
- `npm update -g homebridge-mihomegateway`

# Configuration
Currently, the setup is a bit convoluted - sorry about that!

This will all be automated in upcoming releases but for now a bit of manual work is required.

## Sample Configuration
```json
"platforms": [{
    "name": "MiHome Gateway",
    "platform": "MiHomeGateway",
    "username": "",
    "password": ""
}]
```
- `name` - a friendly label for the MiHome gateway
- `platform` - must be set to **MiHomeGateway**
- `username` - call the [register user service](https://mihome4u.co.uk/docs/api-documentation/users-api/sign-up-a-new-user) to create a new api user
- `password` - the password you used to register with (your password is only used for one initial authentication call - subsequent calls will use the api key obtained during authentication)
- `token` - [optional] the api key token obtained during authentication
- `baseUrl` - [optional] an override for the MiHome API URL

## TODO
-[] Add additional device types (currently only supports light switches)
-[] Automate registration

## Credits
- Adrian Rudman for [homebridge-platform-wemo](https://github.com/rudders/homebridge-platform-wemo) which I based this plugin on
