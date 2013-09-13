
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

            test.strictEqual(instance.targets, './');
            test.strictEqual(instance.extensions.length, 4);
            test.strictEqual(instance.log, console.log);
            test.strictEqual(instance.verbosity, 2);
            test.strictEqual(instance.depth, 0);

            test.done();
        },

        'Test custom configuration': function (test) {
            var logFunction = function () {},
                instance = new RetinaDownsizer({
                    targets: [ './foo', './bar' ],
                    extensions: [ 'gif' ],
                    log: logFunction,
                    verbosity: 1,
                    depth: 2
                });

            test.strictEqual(instance.targets[0], './foo');
            test.strictEqual(instance.targets[1], './bar');
            test.strictEqual(instance.extensions.length, 1);
            test.strictEqual(instance.log, logFunction);
            test.strictEqual(instance.verbosity, 1);
            test.strictEqual(instance.depth, 2);

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

        'Test with single target': function (test) {
            var downsizer = new RetinaDownsizer({ targets: config.tempDir, log: function () {} });
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

        'Test targeting multiple directories': function (test) {
            var downsizer = new RetinaDownsizer({
                targets: [
                    path.resolve(config.tempDir, 'foo'),
                    path.resolve(config.tempDir, 'bar')
                ],
                log: function () {}
            });
                files = [
                    path.resolve(config.tempDir, 'foo/a@2x.png'),
                    path.resolve(config.tempDir, 'foo/b@2x.png'),
                    path.resolve(config.tempDir, 'bar/c@2x.png'),
                    path.resolve(config.tempDir, 'bar/d@2x.png')
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(results.length, 4);
                test.done();
            });
        },

        'Test targeting directories and files': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: [
                        path.resolve(config.tempDir, 'foo'),
                        path.resolve(config.tempDir, 'bar'),
                        path.resolve(config.tempDir, 'test@2x.png')
                    ],
                    log: function () {}
                }),
                files = [
                    path.resolve(config.tempDir, 'foo/a@2x.png'),
                    path.resolve(config.tempDir, 'bar/c@2x.png'),
                    path.resolve(config.tempDir, 'test@2x.png')
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(results.length, 3);
                test.done();
            });
        },

        'Test walking depth': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: path.resolve(config.tempDir, './'),
                    log: function () {},
                    depth: 2
                }),
                files = [
                    path.resolve(config.tempDir, 'target@2x.png'),
                    path.resolve(config.tempDir, 'sub/target@2x.png'),
                    path.resolve(config.tempDir, 'sub/sub/ignore@2x.png'),
                    path.resolve(config.tempDir, 'sub/sub/sub/ignore@2x.png'),
                    path.resolve(config.tempDir, 'sub/sub/sub/sub/ignore@2x.png')
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(results.length, 2);
                test.done();
            });
        },

        'Test that targets don\'t overlap': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: [
                        path.resolve(config.tempDir, 'foo'),
                        path.resolve(config.tempDir, 'foo/bar@2x.png'),
                    ],
                    log: function () {}
                }),
                files = [
                    path.resolve(config.tempDir, 'foo/bar@2x.png'),
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(results.length, 1);
                test.done();
            });
        },

        'Test downsize renaming': function (test) {
            var downsizer = new RetinaDownsizer({ targets: config.tempDir, log: function () {} }),
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
            var downsizer = new RetinaDownsizer({ targets: config.tempDir, log: function () {} }),
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

        'Test downsize logs with verbosity 2': function (test) {
            var logs = [],
                downsizer = new RetinaDownsizer({
                    targets: config.tempDir,
                    log: function (msg) {
                        logs.push(msg);
                    },
                    verbosity: 2
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
        },

        'Test downsize logs with verbosity 1': function (test) {
            var logs = [],
                downsizer = new RetinaDownsizer({
                    targets: config.tempDir,
                    log: function (msg) {
                        logs.push(msg);
                    },
                    verbosity: 1
                });
                files = [ path.resolve(config.tempDir, 'foo@2x.png') ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(logs.length, 2);

                test.done();
            });
        },

        'Test downsize logs with verbosity 0': function (test) {
            var logs = [],
                downsizer = new RetinaDownsizer({
                    targets: config.tempDir,
                    log: function (msg) {
                        logs.push(msg);
                    },
                    verbosity: 0
                });
                files = [ path.resolve(config.tempDir, 'foo@2x.png') ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(logs.length, 0);

                test.done();
            });
        }

    }
};
