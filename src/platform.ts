import { APIEvent } from 'homebridge';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SubDevice, DeviceType } from './models';
import { SwitchAccessory } from './switchAccessory';
import { EnergenieApi } from './energenieApi';
import { MiHomePlatformAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MiHomeGateway implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service;
  public readonly Characteristic = this.api.hap.Characteristic;
  public readonly EnergenieApi: EnergenieApi;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.EnergenieApi = new EnergenieApi(log, config.username, config.password, config.baseUrl || 'https://mihome4u.co.uk/api/v1/');

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Restoring accessory from cache:', accessory.displayName);

    this.createAccessoryHandler(accessory);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Calls the Energenie API to find devices registered
   */
  async discoverDevices(): Promise<void> {
    try {
      await this.EnergenieApi.auth();
    } catch (err) {
      this.log.error('Error authenticating', err);

      return Promise.resolve();
    }

    try {
      const devices = await this.EnergenieApi.getSubDevices();

      // loop over the discovered devices and register each one if it has not already been registered
      for (const device of devices) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = this.api.hap.uuid.generate(device.id.toString());

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          this.log.debug('Found existing accessory:', device.label);

          if (this.isNullOrEmpty(existingAccessory.context.device)) {
            this.log.debug('Device context was null, restoring');

            existingAccessory.context.device = device;
          }

          this.api.updatePlatformAccessories([existingAccessory]);

        } else {
          this.log.debug('Registering new accessory:', device.label);

          // create a new accessory
          const accessory = new this.api.platformAccessory(device.label, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          const platformAccessory = this.createAccessoryHandler(accessory);

          if (platformAccessory !== null) {
            // link the accessory to your platform
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

            // push into accessory cache
            this.accessories.push(accessory);
          }
        }
      }
    } catch (err) {
      this.log.debug('Error discovering devices', err);
    }
  }

  private createAccessoryHandler(accessory: PlatformAccessory): MiHomePlatformAccessory | null {
    const device: SubDevice = accessory.context.device;

    if (this.isNullOrEmpty(device)) {
      this.log.warn('Device context is null, unable to create accessory');
      return null;
    }

    try {
      switch (device.device_type) {
        case DeviceType.CONTROL:
        case DeviceType.LEGACY:
        case DeviceType.LIGHT:
        case DeviceType.RELAY:
          return new SwitchAccessory(this, accessory);
        default:
          this.log.warn('Accessory type not supported: %s [%s]', device.label, device.device_type);
          return null;
      }
    } catch (err) {
      this.log.error('Error creating accessory handler', err);
      return null;
    }
  }

  private isNullOrEmpty<T>(obj: T): boolean {
    return obj === null || Object.keys(obj).length === 0;
  }
}