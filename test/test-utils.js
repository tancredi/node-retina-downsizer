
var config = require('./config'),
    rimraf = require('rimraf'),
    fs = require('fs'),
    exec = require('child_process').exec,
    path = require('path'),
    im = require('imagemagick'),
    async = require('async');

module.exports = {

    createTestImage: function (w, h, filePath, callback) {
        var parts = filePath.split('/'),
            absPath = path.resolve(__dirname, config.tempDir, filePath),
            self = this,
            dir, root, subs;

        if (parts.length) {
            parts.pop();
            dir = parts.join('/');
        }

        if (dir.length) {
            root = config.tempDir;
            subs = path.relative(config.tempDir, absPath).split('/');

            for (var i = 0; i < subs.length - 1; i += 1) {
                try {
                    fs.mkdirSync(path.resolve(__dirname, root, subs[i]));
                } catch (err) {
                    if (err.code !== 'EEXIST') {
                        throw err;
                    }
                }

                root = path.resolve(root, subs[i]);
            }

            self.writeTestImage(w, h, filePath, callback);
        } else {
            self.writeTestImage(w, h, filePath, callback);
        }
    },

    writeTestImage: function (w, h, filePath, callback) {
        var absPath = path.resolve(__dirname, config.tempDir, filePath);

        im.convert([ '-size', w + 'x' + h, 'xc:white', absPath ], function (err) {
            if (err) { throw err; }

            callback(absPath);
        });
    },

    createAssetDir: function (callback) {
        fs.mkdir(config.tempDir, function (err) {
            var images = {}, i;

            if (err && err.code !== 'EEXIST') {
                throw err;
            }

            callback();
        });
    },

    destroyAssetsDir: function (callback) {
        rimraf(config.tempDir, callback);
    },

    createSamplesAndRun: function (downsizer, files, callback) {
        var self = this;

        async.map(files, function (file, callback) {
            self.createTestImage(50, 50, file, function (t) {
                callback(null, t);
            });
        }, function () {
            downsizer.run(function (err, generated) {
                async.map(generated, im.identify, callback);
            });
        });
    },

    execCommandLineTool: function (options, callback) {
        var optStr = (options.length ? ' ' + options.join(' ') : '');
        exec("node " + path.resolve(__dirname, '../lib/retinadownsize.js') + optStr, callback);
    }

};
