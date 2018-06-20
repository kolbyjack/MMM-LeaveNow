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
    parkTime: 5 * 60,
    overdueTimeout: 15 * 60,
    leaveNowTime: 5 * 60,
    maxDisplayTime: 90 * 60,
    maxCheckTime: 24 * 60 * 60
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
      if ((self.event.startDate - now) * 0.001 <= self.config.maxCheckTime) {
        self.sendSocketNotification("LEAVENOW_FETCH", {
          config: self.config,
          event: self.event,
        });
      } else {
        self.directions = null;
      }

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
      var timeUntilEvent = ((self.event.startDate.getTime() - (new Date().getTime())) * 0.001) | 0;
      var route = self.directions.routes.reduce(function(best, route) {
        var routeTravelTime = route.legs.reduce(function(total, leg) {
          return total + leg.duration.value;
        }, 0);

        if (best === undefined || routeTravelTime < best.travelTime) {
          return { travelTime: routeTravelTime, summary: route.summary };
        } else {
          return best;
        }
      }, undefined);
      var delta = timeUntilEvent - route.travelTime - self.config.parkTime;

      if (delta < -self.config.overdueTimeout) {
        findNextEvent();
      } else if (delta <= self.config.leaveNowTime) {
        wrapper.innerHTML = sprintf("Leave now for {}", self.event.title);
      } else if (delta <= self.config.maxDisplayTime) {
        // TODO: Improve message format
        wrapper.innerHTML = sprintf("Leave in {} minutes for {}", (delta / 60) | 0, self.event.title);
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
