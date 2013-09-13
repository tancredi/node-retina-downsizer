
var RetinaDownsizer = require('../../index.js'),
    utils = require('../test-utils'),
    config = require('../config'),
    im = require('imagemagick'),
    path = require('path'),
    fs = require('fs'),
    async =require('async');

module.exports = {
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

        'Test with custom densities target': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: config.tempDir,
                    log: function () {},
                    densities: [ 0.5, 1, 1.5 ]
                });

            utils.createTestImage(200, 200, 'foo@2x.png', function () {

                downsizer.run(function (err, generated) {
                    if (err) { throw err; }

                    async.map([
                        path.resolve(config.tempDir, 'foo.png'),
                        path.resolve(config.tempDir, 'foo@1.5.png'),
                        path.resolve(config.tempDir, 'foo@0.5.png')
                    ],
                    im.identify,
                    function (err, features) {
                        if (err) { throw err; }

                        test.strictEqual(features[0].width, 100);
                        test.strictEqual(features[0].height, 100);

                        test.strictEqual(features[1].width, 150);
                        test.strictEqual(features[1].height, 150);

                        test.strictEqual(features[2].width, 50);
                        test.strictEqual(features[2].height, 50);

                        test.done();
                    });
                });

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

        'Test limited walking depth': function (test) {
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

        'Test with no walking depth': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: path.resolve(config.tempDir, './'),
                    log: function () {},
                    depth: 1
                }),
                files = [
                    path.resolve(config.tempDir, 'target@2x.png'),
                    path.resolve(config.tempDir, 'sub/ignore@2x.png'),
                    path.resolve(config.tempDir, 'sub/sub/ignore@2x.png')
                ];

            utils.createSamplesAndRun(downsizer, files, function (err, results) {
                if (err) { throw err; }

                test.strictEqual(results.length, 1);
                test.done();
            });
        },

        'Test that targets don\'t overlap': function (test) {
            var downsizer = new RetinaDownsizer({
                    targets: [
                        path.resolve(config.tempDir, 'foo'),
                        path.resolve(config.tempDir, 'foo/bar@2x.png')
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
