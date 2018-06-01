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
|`origin`|`none`|Required.  The origin address to use when calculating directions.|
|`updateInterval`|`5 * 60`|How often (in seconds) to check for updated travel time.|
