# Module: MMM-LeaveNow
The module allows you to add wallpapers from bing or reddit.  Useful for MagicMirror installations that aren't actually mirrors.

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/kolbyjack/MMM-LeaveNow.git
````

Configure the module in your `config.js` file.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: "MMM-LeaveNow",
    position: "bottom_center",
    config: { // See "Configuration options" for more information.
      origin: "1600 Amphitheatre Pkwy, Mountain View, CA 94043",
      apikey: "0123456789abcdefg"
    }
  }
]
````

## Configuration options

The following properties can be configured:


|Option|Default|Description|
|---|---|---|
|`apikey`|`none`|Required.  The Google Directions API Key, see https://developers.google.com/maps/documentation/directions/get-api-key for more info.|
|`leaveNowTime`|`5 * 60`|How long (in seconds) to show "Leave now" before the calculated time to leave.|
|`maxCheckTime`|`24 * 60 * 60`|Maximum time (in seconds) before at event's start time that directions requests will be made.|
|`maxDisplayTime`|`90 * 60`|Maximum time (in seconds) that the "Leave now" countdown will be shown.|
|`origin`|`none`|Required.  The origin address to use when calculating directions.|
|`overdueTimeout`|`15 * 60`|How long (in seconds) to show "Leave now" after the calculated time to leave.|
|`parkTime`|`5 * 60`|How long (in seconds) to add to the estimated travel time to allow for parking.|
|`updateInterval`|`5 * 60`|How often (in seconds) to check for updated travel time.|
