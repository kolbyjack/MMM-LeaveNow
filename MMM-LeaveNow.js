// MMM-LeaveNow.js

function sprintf(fmt) {
  var parts = fmt.split("{}");
  var message = parts[0];
  var i;

  for (i = 1; i < parts.length; ++i) {
    message += arguments[i] + parts[i];
  }

  return message;
}

Module.register("MMM-LeaveNow", {
  // Default module config
  defaults: {
    updateInterval: 5 * 60,
  },

  start: function() {
    var self = this;

    self.events = [];
    self.event = null;
    self.directions = null;
    self.updateTimer = null;

    setInterval(function() { self.updateDom(); }, 60 * 1000);
  },

  notificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "CALENDAR_EVENTS") {
      self.events = payload.map(e => {
        e.startDate = new Date(e.startDate);
        e.endDate = new Date(e.endDate);
        return e;
      });
      self.findNextEvent();
    }
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "LEAVENOW_DIRECTIONS") {
      // TODO: Verify directions are valid
      self.directions = payload;
      self.updateDom();
    }
  },

  getData: function() {
    var self = this;
    var now = new Date();

    if (self.event === null) {
      if (self.updateTimer !== null) {
        clearInterval(self.updateTimer);
        self.updateTimer = null;
      }
    } else if (self.event.startDate > now) {
      self.sendSocketNotification("LEAVENOW_FETCH", {
        config: self.config,
        destination: self.event.location,
      });

      if (self.updateTimer === null) {
        self.updateTimer = setInterval(function() { self.getData(); }, self.config.updateInterval * 1000);
      }
    } else {
      self.findNextEvent();
    }
  },

  getDom: function() {
    var self = this;
    var wrapper = document.createElement("div");

    wrapper.className += "small";
    if (self.directions !== null) {
      // TODO: Check all routes for fastest
      var now = new Date().getTime();
      var parkTime = 5 * 60 * 1000;
      var travelTime = self.directions.routes[0].legs[0].duration.value * 1000;
      var delta = ((self.event.startDate.getTime() - now - parkTime - travelTime) * 0.001) | 0;
      var minutes = (delta / 60) | 0;

      if (minutes <= 90) {
        // TODO: Improve message format
        wrapper.innerHTML = sprintf("Leave in {} minutes for {} via {}",
          minutes, self.event.title, self.directions.routes[0].summary);
      }
    } else if (self.event !== null) {
      //wrapper.innerHTML = sprintf("Fetching directions to {}", self.event.title);
    }

    return wrapper;
  },

  findNextEvent: function() {
    var self = this;
    var now = new Date();

    for (var i in self.events) {
      var e = self.events[i];

      if (!e.fullDayEvent && e.startDate > now && e.location && e.location !== self.config.origin) {
        if (self.event === null ||
            self.event.location !== e.location ||
            self.event.startDate !== e.startDate)
        {
          self.event = e;
          self.directions = null;
          self.getData();
          self.updateDom();
        }
        return;
      }
    }

    self.event = null;
    self.directions = null;
    self.updateDom();
  }
});
