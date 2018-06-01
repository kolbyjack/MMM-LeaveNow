"use strict";

const NodeHelper = require("node_helper");
const request = require("request");
const crypto = require("crypto");

module.exports = NodeHelper.create({
  start: function() {
    var self = this;

    console.log("Starting node helper for: " + self.name);

    self.cache = {};
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "LEAVENOW_FETCH") {
      self.fetchData(payload);
    }
  },

  fetchData: function(event) {
    var self = this;
    var cacheKey = self.getCacheKey(event);

    if (cacheKey in self.cache && Date.now() < self.cache[cacheKey].expires) {
      self.sendSocketNotification("LEAVENOW_DIRECTIONS", self.cache[cacheKey].directions);
      return;
    }

    request({
      url: "https://maps.googleapis.com/maps/api/directions/json",
      qs: {
        origin: event.config.origin,
        destination: event.destination,
        key: event.config.apikey
      },
      method: "GET",
      headers: { "cache-control": "no-cache" },
    },
    function(error, response, body) {
      if (error) {
        self.sendSocketNotification("LEAVENOW_FETCHERROR", { error: error });
        return console.error(" ERROR - MMM-LeaveNow: " + error);
      }

      if (response.statusCode === 200) {
        var directions = JSON.parse(body);

        self.cache[cacheKey] = {
          expires: Date.now() + event.config.updateInterval * 900,
          directions: directions,
        };

        self.sendSocketNotification("LEAVENOW_DIRECTIONS", directions);
      }
    });
  },

  getCacheKey: function(event) {
    let hash = crypto.createHash("sha1");
    hash.update(event.config.origin + "::" + event.destination);
    return hash.digest("base64");
  },
});
