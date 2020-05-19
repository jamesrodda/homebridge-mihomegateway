import { APIEvent } from 'homebridge';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, MIHOME_API_BASE_URL } from './settings';
import { SwitchAccessory } from './accessories/switchAccessory';

import { DeviceType } from './energenieApi/models';
import { EnergenieApi } from './energenieApi/energenieApi';

/**
 * MiHome Gateway Platform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MiHomeGatewayPlatform implements DynamicPlatformPlugin {
  public readonly Service = this.api.hap.Service;
  public readonly Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly EnergenieApi: EnergenieApi;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    if (!this.config.username) {
      this.log.error('Username not set.');
    }

    if (!this.config.password) {
      if (this.config.token) {
        this.config.password = this.config.token;
      } else {
        this.log.error('Password or token not set.');
      }
    }

    if (!this.config.baseUrl) {
      this.config.baseUrl = MIHOME_API_BASE_URL;
    }

    this.EnergenieApi = new EnergenieApi(this.log, this.config.username, this.config.password, this.config.baseUrl);

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

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Calls the Energenie API to find devices registered
   */
  async discoverDevices(): Promise<void> {
    
    try {
      await this.EnergenieApi.auth();
    } catch (error) {
      this.log.error('Error authenticating:', error);
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
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', device.label);

          existingAccessory.context.device = device;
          this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          this.newPlatformAccessory(existingAccessory);
        
        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info('Adding new accessory:', device.label);

          // create a new accessory
          const accessory = new this.api.platformAccessory(device.label, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          this.newPlatformAccessory(accessory);

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    } catch (err) {
      this.log.debug('Error discovering devices', err);
    }
  }

  /**
   * create the accessory handler for the newly create accessory
   * @param accessory Platform accessory.
   */
  protected newPlatformAccessory(accessory: PlatformAccessory) {
    switch (accessory.context.device.device_type) {
      case DeviceType.CONTROL:
      case DeviceType.LEGACY:
      case DeviceType.LIGHT:
      case DeviceType.RELAY:
        new SwitchAccessory(this, accessory);
        break;
      default:
        this.log.warn('Device type not supported:', accessory.context.device.label, accessory.context.device.device_type);
    }
  }
}