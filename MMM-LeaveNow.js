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
    maxCheckTime: 24 * 60 * 60,
    useLocalFeed: false,
  },

  start: function() {
    var self = this;

    self.events = [];
    self.event = null;
    self.directions = null;
    self.updateTimer = null;
    self.calendarTimer = null;

    setInterval(function() { self.updateContent(); }, 60 * 1000);
  },

  notificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "CALENDAR_EVENTS") {
      self.pendingEvents = payload.map(e => {
        e.startDate = new Date(e.startDate);
        e.endDate = new Date(e.endDate);
        return e;
      });

      if (self.calendarTimer !== null) {
        clearTimeout(self.calendarTimer);
      }

      self.calendarTimer = setTimeout(() => {
        self.calendarTimer = null;
        self.events = self.pendingEvents;
        self.findNextEvent();
      }, 5000);
    }
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "LEAVENOW_DIRECTIONS") {
      // TODO: Verify directions are valid
      self.directions = payload;
      self.updateContent();
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

    wrapper.className += "small bright";
    wrapper.innerHTML = self.getContent();

    return wrapper;
  },

  findNextEvent: function() {
    var self = this;
    var now = new Date();

    for (var i in self.events) {
      var e = self.events[i];

      if (!e.fullDayEvent &&
          e.startDate > now &&
          e.location &&
          !e.location.toLowerCase().startsWith("http:") &&
          !e.location.toLowerCase().startsWith("https:") &&
          e.location !== self.config.origin)
      {
        if (self.event === null ||
            self.event.location !== e.location ||
            self.event.startDate !== e.startDate)
        {
          self.event = e;
          self.directions = null;
          self.getData();
          self.updateContent();
        }
        return;
      }
    }

    self.event = null;
    self.directions = null;
    self.updateContent();
  },

  getContent: function() {
    var self = this;

    if (self.directions === null) {
      if (self.event !== null) {
        //return sprintf("Fetching directions to {}", self.event.title);
      }
      return "";
    }

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

    if (route === undefined) {
      return sprintf("Unable to retrieve directions to {}", self.event.title);
    }

    var delta = timeUntilEvent - route.travelTime - self.config.parkTime;
    if (delta < -self.config.overdueTimeout) {
      self.findNextEvent();
    } else if (delta <= self.config.leaveNowTime) {
      return sprintf("Leave now for {}", self.event.title);
    } else if (delta <= self.config.maxDisplayTime) {
      // TODO: Improve message format
      return sprintf("Leave in {} minutes for {}", (delta / 60) | 0, self.event.title);
    }

    return "";
  },

  updateContent: function() {
    var self = this;

    if (self.config.useLocalFeed) {
      var html = self.getContent();

      if (html !== self.lastContent) {
        self.lastContent = html;
        if (html.length > 0) {
          self.sendNotification("LOCALFEED_ADD_ITEM", { id: "directions", html: html, duration: self.config.updateInterval * 2 });
        } else {
          self.sendNotification("LOCALFEED_REMOVE_ITEM", { id: "directions" });
        }
      }
    } else {
      self.updateDom();
    }
  }
});
