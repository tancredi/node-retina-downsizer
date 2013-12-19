var path = require('path'),
    _ = require('underscore'),
    async = require('async'),
    color = require('cli-color'),
    walk = require('walkdir'),
    downsizeImage = require('./utils/downsizeImage');

var RetinaDownsizer,
    parallelLimit = 50;

RetinaDownsizer = function (options) {
    options = options || {};
    this.targets = options.targets || './';
    this.extensions = options.extensions || [ 'png', 'jpg', 'jpeg', 'gif' ];
    this.log = options.log || console.log;
    this.verbosity = (typeof options.verbosity === 'number' ? options.verbosity : 2);
    this.depth = options.depth || 0;
    this.densities = options.densities || [ 1 ];
};

RetinaDownsizer.prototype.run = function (callback) {
    var files = this.getAssetsList(),
        self = this;

    async.mapLimit(files, parallelLimit, function (file, callback) {
        self.downsizeAsset(file, callback);
    }, function (err, newFileSets) {
        var newFiles = _.flatten(newFileSets);

        if (self.verbosity > 0) {
            self.log(color.bold(color.green('Done - ' + newFiles.length + '/' + files.length + ' downsized')));
        }

        if (typeof callback === 'function') {
            callback(err, newFiles);
        }
    });
};

RetinaDownsizer.prototype.downsizeAsset = function (file, callback) {
    var self = this;

    if (this.verbosity > 0) {
        this.log(color.cyan('Downsizing ' + path.relative(file.root, file.path) + '…'));
    }

    async.map(this.densities, function (density, callback) {

        downsizeImage(file.path, density, function (err, newFile) {
            if (err) {
                if (self.verbosity > 1) {
                    self.log(color.red('✘ ') + color.white(err));
                }
                return callback(err, null);
            }

            if (self.verbosity > 1) {
                self.log(color.green('✓ ') + color.white('Created ' + path.relative(file.root, newFile)));
            }

            callback(null, newFile);
        });

    }, function (err, files) {
        callback(err, files);
    });
};

RetinaDownsizer.prototype.getAssetsList = function () {
    var targets = (typeof this.targets === 'string' ? [ this.targets ] : this.targets),
        paths = [], files = [], scanned = [],
        i, n, parts, ext, suffixed;

    for (i = 0; i < targets.length; i += 1) {
        paths = walk.sync(targets[i], { max_depth: this.depth || 0 });

        for (n = 0; n < paths.length; n += 1) {
            if (scanned.indexOf(paths[n]) === -1) {
                parts = paths[n].split('.');
                ext = parts[parts.length - 1];
                suffixed = parts[parts.length - 2] && parts[parts.length - 2].substr(-3) === '@2x';

                if (suffixed && this.extensions.indexOf(ext) !== -1) {
                    files.push({ root: targets[i], path: paths[n] });
                }

                scanned.push(paths[n]);
            }
        }
    }

    return files;
};

module.exports = RetinaDownsizer;