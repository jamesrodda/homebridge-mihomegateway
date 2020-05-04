import { MiHomeGateway } from './platform';
import {
  PlatformAccessory,
  CharacteristicEventTypes,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
  Service,
} from 'homebridge';
import { MiHomePlatformAccessory } from './platformAccessory';

export class SwitchAccessory extends MiHomePlatformAccessory {

  private states = {
    On: false,
  };

  private service: Service;

  constructor(
    platform: MiHomeGateway,
    accessory: PlatformAccessory,
  ) {

    super(platform, accessory);

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Energenie')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context);

    // get the Switch service if it exists, otherwise create a new Switch service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Switch) ?? this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.label);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/gen/HomeKit.ts

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.states.On = value as boolean;

    this.platform.log.debug('Set Characteristic On ->', value);

    const switchState = this.service.getCharacteristic(this.platform.Characteristic.On);

    if (switchState.value !== value) {
      const endpoint = this.states.On ? 'power_on' : 'power_off';
      this.platform.log.debug('start %s', endpoint);

      this.platform.EnergenieApi.toggleSocketPower(this.accessory.context.device.id, endpoint)
        .then(() => {
          this.platform.log.debug('%s complete', endpoint);
          callback(null);
        })
        .catch(err => {
          this.platform.log.debug('Error \'%s\' setting switch state', err);
          callback(err || new Error('Error setting switch state.'));
        });
    } else {
      callback(null);
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory.
  */
  getOn(callback: CharacteristicGetCallback) {

    // The Energenie API doesn't actually return an accurate value for power_state.
    // If the switch is toggled phsyically or via another route, i.e. Alexa, the new
    // value is not reported by the API. Investigations ongoing to find a solution.
    this.platform.EnergenieApi.getSubdeviceInfo(this.accessory.context.device.id)
      .then(deviceInfo => {
        this.states.On = deviceInfo.power_state === 1;

        this.platform.log.debug('Get Characteristic On ->', this.states.On);

        callback(null, this.states.On);
      })
      .catch(err => {
        callback(err);
      });
  }
}
