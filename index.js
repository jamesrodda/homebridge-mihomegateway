var request = require("request");
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-mihomegateway", "MiHomeGateway", MiHomeGateway, true);
}

function MiHomeGateway(log, config, api) {
  if (!config) {
    log.warn("No configuration provided for MiHomeGateway. Disabling.");
    this.disabled = true;
    return;
  }

  this.log = log;
  this.log("begin constructor");

  this.name = config["name"];
  this.username = config["username"];
  this.accessToken = "";

  this.baseUrl = config["baseUrl"] || "https://mihome4u.co.uk/api/v1/";

  this.api = api;
  this.accessories = {};

  this.api.on('didFinishLaunching', function () {
    this.authenticate(config, () => {
      this.discoverDevices();
    });
  }.bind(this));
}

MiHomeGateway.prototype.discoverDevices = function () {
  this.log("finding devices");
  this.log("username: %s, password: %s", this.username, this.accessToken)
  request.post({
    url: this.baseUrl + "subdevices/list",
    auth: {
      user: this.username,
      pass: this.accessToken,
      sendImmediately: true
    }
  }, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      var json = JSON.parse(body);
      if (json.status === "success") {
        var devices = json.data;
        for (var d in devices) {
          var device = devices[d];
          this.log("Found %s", device.label);
          this.addDevice(device);
        }
        return;
      }
    }
    this.log("Error '%s' finding devices. Response: %s", err, body);
  }.bind(this));
}

MiHomeGateway.prototype.addDevice = function (device) {
  this.log("adding %s:%s", device.id, device.label);

  var uuid = UUIDGen.generate(device.id.toString());

  var accessory = this.accessories[uuid];

  if (typeof accessory === "undefined") {
    this.addAccessory(device);
  } else if (accessory instanceof MiHomeAccessory) {
    accessory.setupDevice(device);
    accessory.observeDevice(device);
  } else {
    this.accessories[uuid] = new MiHomeAccessory(this.log, accessory, device, this);
  }
}

MiHomeGateway.prototype.addAccessory = function (device) {
  var serviceType;

  switch (device.device_type) {
    // A monitor and control radio device
    case "control":
      serviceType = Service.Switch;
    break;
    // A legacy control-only device (plug-in)
    case "legacy":
      serviceType = Service.Switch;
    break;
    // A legacy control-only device (light switch / wall mounted relay)
    case "light":
    case "relay":
      serviceType = Service.Switch;
    break;
    default:
      this.log("Not Supported: %s [%s]", device.label, device.device_type);
  }

  if (serviceType === undefined) {
    return;
  }

  this.log("Found: %s [%s]", device.label, device.id);

  var accessory = new Accessory(device.label, UUIDGen.generate(device.id.toString()));
  var service = accessory.addService(serviceType, device.label);
  this.log("adding");

  this.accessories[accessory.UUID] = new MiHomeAccessory(this.log, accessory, device, this);
  this.api.registerPlatformAccessories("homebridge-mihomegateway", "MiHomeGateway", [accessory]);
}

MiHomeGateway.prototype.removeAccessory = function (accessory) {
  this.log("Removing accessory: %s", accessory.displayName);

  if (this.accessories[accessory.UUID]) {
    delete this.accessories[accessory.UUID];
  }

  this.api.unregisterPlatformAccessories("homebridge-mihomegateway", "MiHomeGateway", [accessory]);
}

MiHomeGateway.prototype.configureAccessory = function (accessory) {
  accessory.updateReachability(true);
  this.accessories[accessory.UUID] = accessory;
}

MiHomeGateway.prototype.configurationRequestHandler = function (context, request, callback) {
  var self = this;
  var respDict = {};

  if (request && request.type === "Terminate") {
    context.onScreen = null;
  }

  var sortAccessories = function () {
    context.sortedAccessories = Object.keys(self.accessories).map(
      function (k) {
        return this[k] instanceof Accessory ? this[k] : this[k].accessory
      },
      self.accessories
    ).sort(function (a, b) {
      if (a.displayName < b.displayName) return -1;
      if (a.displayName > b.displayName) return 1;
      return 0
    });

    return Object.keys(context.sortedAccessories).map(function (k) {
      return this[k].displayName
    }, context.sortedAccessories);
  }

  switch (context.onScreen) {
    case "DoRemove":
      if (request.response.selections) {
        for (var i in request.response.selections.sort()) {
          this.removeAccessory(context.sortedAccessories[request.response.selections[i]]);
        }

        respDict = {
          "type": "Interface",
          "interface": "instruction",
          "title": "Finished",
          "detail": "Accessory removal was successful."
        }

        context.onScreen = null;
        callback(respDict);
      } else {
        context.onScreen = null;
        callback(respDict, "platform", true, this.config);
      }
      break;
    case "Menu":
      context.onScreen = "Remove";
    case "Remove":
      respDict = {
        "type": "Interface",
        "interface": "list",
        "title": "Select accessory to " + context.onScreen.toLowerCase(),
        "allowMultipleSelection": context.onScreen == "Remove",
        "items": sortAccessories()
      }

      context.onScreen = "Do" + context.onScreen;
      callback(respDict);
      break;
    default:
      if (request && (request.response || request.type === "Terminate")) {
        context.onScreen = null;
        callback(respDict, "platform", true, this.config);
      } else {
        respDict = {
          "type": "Interface",
          "interface": "list",
          "title": "Select option",
          "allowMultipleSelection": false,
          "items": ["Remove Accessory"]
        }

        context.onScreen = "Menu";
        callback(respDict);
      }
  }
}

MiHomeGateway.prototype.authenticate = function (config, callback) {
  callback = callback || function () {};
  this.log("authenticating");
  request.post({
    url: this.baseUrl + "users/profile",
    auth: {
      user: this.username,
      pass: config["password"],
      sendImmediately: true
    }
  }, function (err, response, body) {
    if (!err && response.statusCode == 200) {
      var json = JSON.parse(body);
      if (json.status === "success") {
        this.accessToken = json.data.api_key;
        callback();
      }
    } else {
      this.log("Error '%s' authenticating. Response: %s", err, body);
      throw "Authentication failed. See log for details.";
    }
  }.bind(this));
}

function MiHomeAccessory(log, accessory, device, platform) {
  var self = this;

  this.log = log;
  this.accessory = accessory;
  this.device = device;
  this.platform = platform;

  this.setupDevice(device);
  this.updateReachability(true);

  this.accessory.getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "Energenie MiHome")
    .setCharacteristic(Characteristic.Model, device.device_type);

  this.accessory.on('identify', function (paired, callback) {
    self.log("%s - identify", self.accessory.displayName);
    callback();
  });

  this.observeDevice(device);
  this.addEventHandlers();
}

MiHomeAccessory.prototype.setupDevice = function (device) {
  this.device = device;
}

MiHomeAccessory.prototype.observeDevice = function (device) {

}

MiHomeAccessory.prototype.updateReachability = function (reachable) {
  this.accessory.updateReachability(reachable);
}

MiHomeAccessory.prototype.addEventHandlers = function () {
  this.addEventHandler(Service.Switch, Characteristic.On);
}

MiHomeAccessory.prototype.addEventHandler = function (serviceName, characteristic) {
  serviceName = serviceName || Service.Switch;

  var service = this.accessory.getService(serviceName);

  if (service === undefined) {
    return;
  }

  if (service.testCharacteristic(characteristic) === false) {
    return;
  }

  switch (characteristic) {
    case Characteristic.On:
      service
        .getCharacteristic(characteristic)
        .on('set', this.setSwitchState.bind(this));
      break;
    default:
      this.log("Unsupported characteristic: %s", characteristic);
  }
}

MiHomeAccessory.prototype.setSwitchState = function (state, callback) {
  var value = state | 0;
  var service = this.accessory.getService(Service.Switch);
  var switchState = service.getCharacteristic(Characteristic.On);
  callback = callback || function () {};

  if (switchState.value !== value) {
    var endpoint = value ? "power_on" : "power_off";
    this.log("start %s", endpoint);
    request.post({
      url: this.platform.baseUrl + "subdevices/" + endpoint,
      auth: {
        user: this.platform.username,
        pass: this.platform.accessToken,
        sendImmediately: true
      },
      body: "params={ \"id\": " + this.device.id + " }"
    }, function (err, response, body) {
      var json = JSON.parse(body);
      if (json.status === "success") {
        this.log("%s complete", endpoint);
        callback(null); // success
      } else {
        this.log("Error '%s' setting switch state. Response: %s", err, body);
        callback(err || new Error("Error setting switch state."));
      }
    }.bind(this));
  } else {
    callback(null);
  }
}

MiHomeAccessory.prototype.updateSwitchState = function (state) {
  state = state | 0;

  var value = !!state;
  var service = this.accessory.getService(Service.Swtich);
  var switchState = service.getCharacteristic(Characteristic.On);

  if (switchState.value !== value) {
    this.log("%s - Get state: %s", this.accessory.displayName, (value ? "On" : "Off"));

    switchState.updateValue(value);
  }

  return value;
}
