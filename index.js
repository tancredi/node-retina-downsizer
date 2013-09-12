
var path = require('path'),
    async = require('async'),
    color = require('cli-color'),
    walk = require('walkdir'),
    downsizeImage = require('./utils/downsizeImage'),
    RetinaDownsizer;

RetinaDownsizer = function (options) {
    options = options || {};
    this.dir = options.dir || './';
    this.extensions = options.extensions || [ 'png', 'jpg', 'jpeg', 'gif' ];
    this.log = options.log || console.log;
};

RetinaDownsizer.prototype.run = function (callback) {
    var filename, parts, i, suffixed, ext,
        files = this.getAssetsList(),
        self = this;

    async.map(files, function (file, callback) {
        self.log(color.cyan('Downsizing ' + path.relative(self.dir, file) + '…'));

        downsizeImage(file, function (err, newFile) {
            if (err) {
                self.log(color.red('✘ ') + color.white(err));
                return callback(err, null);
            }

            self.log(color.green('✓ ') + color.white('Created ' + path.relative(self.dir, newFile)));
            callback(null, newFile);
        });
    }, function (err, newFiles) {
        self.log(color.bold(color.green('Done - ' + newFiles.length + '/' + files.length + ' downsized')));
        callback(err, newFiles);
    });
};

RetinaDownsizer.prototype.getAssetsList = function () {
    var paths = walk.sync(this.dir),
        files = [];

    for (i = 0; i < paths.length; i += 1) {
        parts = paths[i].split('.');
        ext = parts[parts.length - 1];
        suffixed = parts[parts.length - 2] && parts[parts.length - 2].substr(-3) === '@2x';

        if (suffixed && this.extensions.indexOf(ext) !== -1) {
            files.push(paths[i]);
        }
    }

    return files;
};

module.exports = RetinaDownsizer;
