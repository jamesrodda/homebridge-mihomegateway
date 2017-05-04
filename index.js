var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-mihome", "MiHome", MiHomeAccessory);
}

function MiHomeAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.username = config["username"];
  this.accessToken = config["api_key"];
  this.deviceId = config["device_id"];
  
  this.service = new Service.Switch(this.name);
  
  this.service
    .getCharacteristic(Characteristic.On)
    .on('set', this.setState.bind(this));
}
  
MiHomeAccessory.prototype.setState = function(state, callback) {
    var endpoint = state ? "power_on" : "power_off";
  request.post({
    url: "https://mihome4u.co.uk/api/v1/subdevices/" + endpoint,
    auth: {
        user: this.username,
        pass: this.accessToken,
        sendImmediately: true
    },
    body: "params={ \"id\": " + this.deviceId + " }"
  }, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      this.log("State change complete.");
      
      callback(null); // success
    }
    else {
      this.log("Error '%s' setting switch state. Response: %s", err, body);
      callback(err || new Error("Error setting switch state."));
    }
  }.bind(this));
}

MiHomeAccessory.prototype.getServices = function() {
  return [this.service];
}