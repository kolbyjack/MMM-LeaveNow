"use strict";

const NodeHelper = require("node_helper");
const request = require("request");

module.exports = NodeHelper.create({
  start: function() {
    var self = this;

    console.log("Starting node helper for: " + self.name);
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "LEAVENOW_FETCH") {
      self.fetchData(payload);
    }
  },

  fetchData: function(event) {
    var self = this;

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
        self.sendSocketNotification("LEAVENOW_DIRECTIONS", JSON.parse(body));
      }
    });
  },
});
