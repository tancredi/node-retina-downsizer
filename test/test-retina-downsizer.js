
var RetinaDownsizer = require('../index.js'),
    downsizeImage = require('../utils/downsizeImage.js'),
    im = require('imagemagick'),
    path = require('path'),
    fs = require('fs'),
    async =require('async'),
    config = require('./config'),
    utils = require('./utils');

module.exports = {

    'Class tests': {

        'Test class methods': function (test) {
            test.equals(typeof RetinaDownsizer, 'function');
            test.notStrictEqual(typeof RetinaDownsizer.prototype.run, 'undefined');

            test.done();
        },

        'Test default configuration': function (test) {
            var configuration = {},
                instance;

            test.doesNotThrow(function () {
                instance = new RetinaDownsizer();
            }, 'Fails initialising without options');

            test.strictEqual(instance.dir, './');
            test.strictEqual(instance.extensions.length, 4);
            test.strictEqual(instance.log, console.log);

            test.done();
        },

        'Test custom configuration': function (test) {
            var logFunction = function () {},
                instance = new RetinaDownsizer({
                    dir: '/test',
                    extensions: [ 'gif' ],
                    log: logFunction
                });

            test.strictEqual(instance.dir, '/test');
            test.strictEqual(instance.extensions.length, 1);
            test.strictEqual(instance.log, logFunction);

            test.done();
        },

    },
    'Downsize utility tests': {
        setUp: utils.createAssetDir,
        tearDown: utils.destroyAssetsDir,

        'Test downsize of a single image': function (test) {
            utils.createTestImage(200, 200, 'test/sample@2x.png', function (filePath) {
                im.identify(filePath, function (err, features) {
                    if (err) { throw err; }

                    test.strictEqual(features.width, 200);
                    test.strictEqual(features.height, 200);

                    downsizeImage(filePath, function (err, newFile) {
                        if (err) { throw err; }

                        im.identify(newFile, function (err, features) {
                            if (err) { throw err; }

                            test.strictEqual(features.width, 100);
                            test.strictEqual(features.height, 100);

                            test.done();
                        });
                    });
                });
            });
        },

        'Test downsize error on lack of retina suffix': function (test) {
            utils.createTestImage(200, 200, 'test/no-suffix.png', function (filePath) {

                test.throws(function () {
                    downsizeImage(filePath, function (err, newFile) {
                        if (err) { throw err; }
                    });
                }, Error);

                test.done();
            });
        },

        'Test downsize flooring on odd sizes': function (test) {
            utils.createTestImage(199, 200, 'aaa@2x.png', function (filePath) {

                downsizeImage(filePath, function (err, newFile) {
                    if (err) { throw err; }

                    im.identify(newFile, function (err, features) {
                        test.strictEqual(features.width, 100);
                        test.strictEqual(features.height, 100);

                        test.done();
                    });
                });
            });
        }

    },
    'Downsize tool tests': {
        setUp: utils.createAssetDir,
        tearDown: utils.destroyAssetsDir,

        'Test downsize run cases': function (test) {
            var downsizer = new RetinaDownsizer({ dir: config.tempDir, log: function () {} });
                files = [
                    path.resolve(config.tempDir, 'foo@2x.png'),
                    path.resolve(config.tempDir, 'foo/bar@2x.png'),
                    path.resolve(config.tempDir, 'foo/bar/test@2x.png'),
                    path.resolve(config.tempDir, 'different-ext@2x.jpg'),
                    path.resolve(config.tempDir, 'ignore-me.png'),
                    path.resolve(config.tempDir, 'ignore-me@2x.ico')
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                for (var i = 0; i < results.length; i += 1) {
                    test.strictEqual(results[i].width, 25);
                }

                test.strictEqual(results.length, 4);
                test.done();
            });
        },

        'Test downsize renaming': function (test) {
            var downsizer = new RetinaDownsizer({ dir: config.tempDir, log: function () {} }),
                files = [
                    path.resolve(config.tempDir, 'foo@2x.png')
                ],
                newName = path.resolve(config.tempDir, 'foo.png');

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                fs.exists(newName, function (exists) {
                    test.ok(exists);
                    test.done();
                });
            });
        },

        'Test downsize recursivity': function (test) {
            var downsizer = new RetinaDownsizer({ dir: config.tempDir, log: function () {} }),
                files = [
                    path.resolve(config.tempDir, 'a/b/c/d/e/foo@2x.png')
                ],
                newFile = path.resolve(config.tempDir, 'a/b/c/d/e/foo.png');

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                fs.exists(newFile, function (exists) {
                    test.ok(exists);

                    im.identify(newFile, function (err, features) {
                        if (err) { throw err; }

                        test.strictEqual(features.width, 25);
                        test.strictEqual(features.height, 25);
                        test.done();
                    });
                });
            });
        },

        'Test downsize logs': function (test) {
            var logs = [],
                downsizer = new RetinaDownsizer({
                    dir: config.tempDir,
                    log: function (msg) {
                        logs.push(msg);
                    }
                });
                files = [ path.resolve(config.tempDir, 'foo@2x.png') ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(logs.length, 3);
                test.notStrictEqual(logs[0].indexOf('Downsizing foo@2x.png'), -1);
                test.notStrictEqual(logs[1].indexOf('Created foo.png'), -1);
                test.notStrictEqual(logs[2].indexOf('Done'), -1);
                test.notStrictEqual(logs[2].indexOf('1/1'), -1);

                test.done();
            });
        }

    }
};
