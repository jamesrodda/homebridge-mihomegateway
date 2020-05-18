import type { PlatformAccessory } from 'homebridge';

import { MiHomeGatewayPlatform } from './platform';

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
    // TODO
  }

}
