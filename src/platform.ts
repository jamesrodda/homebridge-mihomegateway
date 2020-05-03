import { APIEvent } from 'homebridge';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SubDevice, DeviceType } from './models';
import { SwitchAccessory } from './switchAccessory';
import { EnergenieApi } from './energenieApi';

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
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
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
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    this.EnergenieApi.auth()
      .then(() => {

        this.EnergenieApi.getSubDevices()
          .then(devices => {

            // loop over the discovered devices and register each one if it has not already been registered
            for (const device of devices) {

              // generate a unique id for the accessory this should be generated from
              // something globally unique, but constant, for example, the device serial
              // number or MAC address
              const uuid = this.api.hap.uuid.generate(device.id.toString());

              // check that the device has not already been registered by checking the
              // cached devices we stored in the `configureAccessory` method above
              if (!this.accessories.find(accessory => accessory.UUID === uuid)) {
                this.log.debug('Registering new accessory:', device.label);

                // create a new accessory
                const accessory = new this.api.platformAccessory(device.label, uuid);

                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;

                this.createAccessoryHandler(accessory);

                // link the accessory to your platform
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

                // push into accessory cache
                this.accessories.push(accessory);

                // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
              }
            }
          })
          .catch(e => {
            this.log.debug(e);
          });
      });
  }

  private createAccessoryHandler(accessory: PlatformAccessory) {
    const device: SubDevice = accessory.context.device;

    switch (device.device_type) {
      case DeviceType.CONTROL:
      case DeviceType.LEGACY:
      case DeviceType.LIGHT:
      case DeviceType.RELAY:
        new SwitchAccessory(this, accessory);
        break;
      default:
        this.log.error('Not supported: %s [%s]', device.label, device.device_type);
    }
  }
}