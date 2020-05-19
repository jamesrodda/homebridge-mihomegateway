import { MiHomeGatewayPlatform } from '../platform';
import { Service, PlatformAccessory, CharacteristicEventTypes } from 'homebridge';

import { UPDATE_STATE_INTERVAL } from '../settings';
import { MiHomePlatformAccessory } from './platformAccessory';

export class SwitchAccessory extends MiHomePlatformAccessory {
  protected service: Service;

  constructor(
    platform: MiHomeGatewayPlatform,
    accessory: PlatformAccessory,
  ) {

    super(platform, accessory);

    // get the Switch service if it exists, otherwise create a new Switch service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Switch) ?? this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.label);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Switch

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on(CharacteristicEventTypes.SET, this.setOn.bind(this))  // SET - bind to the `setOn` method below
      .on(CharacteristicEventTypes.GET, this.getOn.bind(this)); // GET - bind to the `getOn` method below

    // Update the state of a Characteristic asynchronously instead
    // of using the `on('get')` handlers.
    //
    // Here we update the state.
    setInterval(() => {
      // assign the current brightness a random value between 0 and 100
      const currentBrightness = Math.floor(Math.random() * 100);

      // push the new value to HomeKit
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, currentBrightness);

      this.platform.log.debug('Pushed updated current Brightness state to HomeKit:', currentBrightness);
    }, UPDATE_STATE_INTERVAL);
  }

  /**
   * Update the state of a Characteristic asynchronously instead
   * of using the `on('get')` handlers.
   * 
   * Here we update the on / off state using
   * the `updateCharacteristic` method.
   */
  async updateOn() {

    // The Energenie API doesn't actually return an accurate value for power_state.
    // If the switch is toggled phsyically or via another route, i.e. Alexa, the new
    // value is not reported by the API. Investigations ongoing to find a solution.
    try {
      const device = await this.platform.EnergenieApi.getSubdeviceInfo(this.accessory.context.device.id);
      const isOn = device.power_state === 1;

      // push the new value to HomeKit
      this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);

      this.platform.log.debug('Pushed updated current On state to HomeKit:', isOn);
    } catch (err) {
      this.platform.log.error('Error pushing updated current On state to HomeKit:', err);
    }
  }
}
