var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-mihomegateway", "MiHomeGateway", MiHomeGatewayAccessory);
}

function MiHomeGatewayAccessory(log, config) {
  if (!config) {
    this.log("No configuration provided for MiHomeGateway. Disabling.");
    this.disabled = true;
    return;
  }

  this.log = log;
  this.log("begin constructor");

  this.name = config["name"];
  this.username = config["username"];
  this.deviceId = config["device_id"];
  
  this.baseUrl = "https://mihome4u.co.uk/api/v1/";

  this.service = new Service.Switch(this.name);
  this.authenticate(config, this.registerService);
}

MiHomeGatewayAccessory.prototype.registerService = function() {
  this.service
    .getCharacteristic(Characteristic.On)
    .on('set', this.setState.bind(this));
}

MiHomeGatewayAccessory.prototype.authenticate = function(config, callback) {
  if (config["api_key"]) {
    this.accessToken = config["api_key"];
    callback.call(this);
  }
  else {
    this.log("authenticating");
    request.post({
      url: this.baseUrl + "users/profile",
      auth: {
        user: this.username,
        pass: config["password"],
        sendImmediately: true
      }
    }, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        var json = JSON.parse(body);
        if (json.status == "success") {
          this.log("authentication success");
          this.accessToken = json.data.api_key;
            callback.call(this);
        }
      }
      else {
        this.log("Error '%s' authenticating. Response: %s", err, body);
        throw "Authentication failed. See log for details.";
      }
    }.bind(this));
  }
}
  
MiHomeGatewayAccessory.prototype.setState = function(state, callback) {
  var endpoint = state ? "power_on" : "power_off";
  this.log("start %s", endpoint);
  request.post({
    url: this.baseUrl + "subdevices/" + endpoint,
    auth: {
        user: this.username,
        pass: this.accessToken,
        sendImmediately: true
    },
    body: "params={ \"id\": " + this.deviceId + " }"
  }, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      this.log("%s complete", endpoint);
      
      callback(null); // success
    }
    else {
      this.log("Error '%s' setting switch state. Response: %s", err, body);
      callback(err || new Error("Error setting switch state."));
    }
  }.bind(this));
}

MiHomeGatewayAccessory.prototype.getServices = function() {
  return [this.service];
}