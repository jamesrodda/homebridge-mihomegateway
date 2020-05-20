import type { PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { MANUFACTURER, APP_MATCHING_IDENTIFIER } from '../settings';
import { MiHomeGatewayPlatform } from '../platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export abstract class MiHomePlatformAccessory {

  constructor(
    protected readonly platform: MiHomeGatewayPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, this.accessory.context.device_type)
      .setCharacteristic(this.platform.Characteristic.Name, this.accessory.context.label)
      .setCharacteristic(this.platform.Characteristic.AppMatchingIdentifier, APP_MATCHING_IDENTIFIER);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Switch.
   */
  async setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    
    const action = value ? 'power_on' : 'power_off';

    try {
      await this.platform.EnergenieApi.toggleSocketPower(this.accessory.context.device.id, action);

      this.platform.log.debug('Set Characteristic On ->', value);

      callback(null);
    } catch (err) {
      this.platform.log.error('Error setting Characteristic On ->', action, err);
      callback(err);
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory.
   * 
   * The Energenie API doesn't actually return an accurate value for power_state.
   * If the switch is toggled phsyically or via another route, for example; Alexa,
   * the new value is not reported by the API.
   * Investigations ongoing to find a solution.
   */
  async getOn(callback: CharacteristicGetCallback) {

    try {
      const device = await this.platform.EnergenieApi.getSubdeviceInfo(this.accessory.context.device.id);
      const isOn = device.power_state === 1;

      this.platform.log.debug('Get Characteristic On ->', isOn);

      callback(null, isOn);
    } catch (err) {
      this.platform.log.error('Error getting Characteristic On ->', err);
      callback(err);
    }
  }

}
