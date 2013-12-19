
# Retina Downsizer

[![Build Status](https://travis-ci.org/tancredi/node-retina-downsizer.png)](https://travis-ci.org/tancredi/node-retina-downsizer)

> A small build utility based on [node-imagemagick](https://github.com/rsms/node-imagemagick) inclusive of command-line tool to fetch and resize retina suffixed (@2x) assets to different pixel densities in configurable and automated fashion.

# Installation

``npm install retina-downsizer``

# Usage examples

### Usage

Import the module, intanciate it with some options and call `run`, if will run through the specified targets and generate downsized assets.

```javascript
var RetinaDownsizer = require('retina-downsizer'),
    downsize = new RetinaDownsizer({
        targets: './'
    });

downsize.run(function (err, generated) {
    if (err) { throw err; }

    console.log(generated);
    // [ /absolute/path/foo.png, /absolute/path/bar.png, ... ]
});
```

### Multiple targets

You can specify targets as an array, including names of image files and directories to be scanned recursively.

```javascript
var RetinaDownsizer = require('retina-downsizer'),

new RetinaDownsizer({
    targets: [ './assets', './img/foo@2x.png' ]
}).run();
```

### Multiple densities

You can specify an array of custom densities (Relative to retina) to resize your retina assets to.
Useful when serving your assets selectively with media-queries to many types of devices.

Custom densities will be saved with the same names, suffixed @x.x

```javascript
var RetinaDownsizer = require('retina-downsizer'),

new RetinaDownsizer({
    targets: './',
    densities: [ 1, 1.5, 1.8 ]
}).run();
```

# Options

* `targets` (Default: `'./'`) - A string or array of strings containing directories and files to target
* `extensions` (Default: `[ 'png', 'jpg', 'jpeg', 'gif' ]`) - Array of file extensions to target
* `log` (Default: `console.log`) - Allows specifing a custom log/debug function
* `verbosity` (Default: `2`) - Level of verbosity. `0`: Silent, `1`: Log start and results, `2`: Log each operation
* `depth` (Default: `0`) - Depth of range in the specified directory trees. Set to `0` will recur to every sub-directory
* `densities` (Default: `[ 1 ]`) - Array of densities to resize assets to.

# Command-line Tool

### Installation

Install globally to use the command line tool

```
sudo npm install retina-downsizer - g
```

### Usage

Run `retinadownsizer --help`

```
Downsize retina images.
Usage: retinadownsize

Options:
  -v, --verbose    Verbosity level. -v 0: Silent, -v 1: Log start and end, -v 2: (Default) Log each operation.
  -r, --recursive  Use to fetch and downsize all assets in a directory trees                                  
  -h, --help       Show usage info   
```

# Test with nodeunit

You need to install nodeunit as a global dependency

```
sudo npm install -g nodeunit
```

Then run tests with

```
npm test

```
or
```
nodeunit test/tests
```