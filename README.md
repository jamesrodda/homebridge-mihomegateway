# homebridge-mihomegateway

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
"accessories": [{
    "accessory": "MiHomeGateway",
    "name": "",
    "username": "",
    "password": "",
    "api_key": "",
    "device_id": ""
}]
```
- `accessory` - must be set to **MiHomeGateway**
- `name` - the name of the accessory to control
- `username` - call the [register user service](https://mihome4u.co.uk/docs/api-documentation/users-api/sign-up-a-new-user) to create a new api user
- `password` - either provide the password you used to register with or provide the api_key explicitly below. Your password is only used for one initial authentication call. Subsequent calls will use the api key obtained during authentication.
- `api_key` - call the [user profile service](https://mihome4u.co.uk/docs/api-documentation/users-api/fetch-user-profile) using the credentials you provided previously to get an api key
- `device_id` - call the [subdevices service](https://mihome4u.co.uk/docs/api-documentation/subdevices-api/list-all-subdevices) to get the device id for the device you wish to control


## TODO
- List all subdevices on gateway
- Convert to a platform
- Automate registration
