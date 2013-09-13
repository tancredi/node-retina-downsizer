
var path = require('path'),
    async = require('async'),
    color = require('cli-color'),
    walk = require('walkdir'),
    downsizeImage = require('./utils/downsizeImage'),
    RetinaDownsizer;

RetinaDownsizer = function (options) {
    options = options || {};
    this.targets = options.targets || './';
    this.extensions = options.extensions || [ 'png', 'jpg', 'jpeg', 'gif' ];
    this.log = options.log || console.log;
    this.verbosity = (typeof options.verbosity === 'number' ? options.verbosity : 2);
    this.depth = options.depth || 0;
};

RetinaDownsizer.prototype.run = function (callback) {
    var filename, parts, i, suffixed, ext,
        files = this.getAssetsList(),
        self = this;

    async.map(files, function (file, callback) {
        if (self.verbosity > 0) {
            self.log(color.cyan('Downsizing ' + path.relative(file.root, file.path) + '…'));
        }

        downsizeImage(file.path, function (err, newFile) {
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
    }, function (err, newFiles) {
        if (self.verbosity > 0) {
            self.log(color.bold(color.green('Done - ' + newFiles.length + '/' + files.length + ' downsized')));
        }
        if (typeof callback === 'function') {
            callback(err, newFiles);
        }
    });
};

RetinaDownsizer.prototype.getAssetsList = function () {
    var targets = (typeof this.targets === 'string' ? [ this.targets ] : this.targets),
        paths = [], files = [], scanned = [],
        i, n;

    for (i = 0; i < targets.length; i += 1) {
        paths = walk.sync(targets[i], { max_depth: this.depth || undefined });

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
