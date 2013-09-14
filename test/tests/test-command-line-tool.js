
var utils = require('../test-utils'),
    config = require('../config'),
    im = require('imagemagick'),
    path = require('path'),
    fs = require('fs'),
    async =require('async');

module.exports = {
    setUp: utils.createAssetDir,
    tearDown: utils.destroyAssetsDir,

    'Executes without throwing': function (test) {
        test.doesNotThrow(function () {
            utils.execCommandLineTool([], function (err, stdout, stderr) {});
        });

        test.done();
    },

    'Logs error if called with no params': function (test) {
        utils.execCommandLineTool([], function (err, stdout, stderr) {
            test.notStrictEqual(stderr.indexOf('No target directories'), -1);
            test.done();
        });
    },

    'Shows usage if called with -h': function (test) {
        utils.execCommandLineTool([ '-h' ], function (err, stdout, stderr) {
            test.notStrictEqual(stdout.indexOf('Usage:'), -1);
            test.notStrictEqual(stdout.indexOf('-v'), -1);
            test.notStrictEqual(stdout.indexOf('-r'), -1);
            test.notStrictEqual(stdout.indexOf('-h'), -1);
            test.done();
        });
    },

    'Test basic use on single image': function (test) {
        utils.createTestImage(200, 200, 'foo@2x.png', function (filePath) {

            utils.execCommandLineTool([ config.tempDir ], function (err, stdout, stderr) {
                test.notStrictEqual(stdout.indexOf('Created foo.png'), -1);
                test.notStrictEqual(stdout.indexOf('Done'), -1);
                test.notStrictEqual(stdout.indexOf('1/1'), -1);

                im.identify(path.resolve(config.tempDir, 'foo.png'), function (err, features) {
                    if (err) { throw err; }

                    test.strictEqual(features.width, 100);
                    test.strictEqual(features.height, 100);

                    test.done();
                });
            });
        });
    },

    'Test default non-recursive behaviour': function (test) {
        utils.createTestImage(200, 200, 'foo@2x.png', function (filePath) {
            utils.createTestImage(200, 200, 'sub/ignore@2x.png', function (filePath) {

                utils.execCommandLineTool([ config.tempDir ], function (err, stdout, stderr) {
                    test.notStrictEqual(stdout.indexOf('1/1'), -1);
                    test.done();
                });
            });
        });
    },

    'Test recursive behaviour with -r': function (test) {
        utils.createTestImage(200, 200, 'foo@2x.png', function (filePath) {
            utils.createTestImage(200, 200, 'sub/include@2x.png', function (filePath) {

                utils.execCommandLineTool([ config.tempDir, '-r' ], function (err, stdout, stderr) {
                    test.notStrictEqual(stdout.indexOf('2/2'), -1);
                    test.done();
                });
            });
        });
    },

    'Test verbosity levels with -vx': function (test) {
        utils.createTestImage(200, 200, 'foo@2x.png', function (filePath) {

            async.parallel([
                function (callback) {
                    utils.execCommandLineTool([ config.tempDir, '-v0' ], function (err, stdout, stderr) {
                        test.strictEqual(stdout.length, 0);
                        callback();
                    });
                },
                function (callback) {
                    utils.execCommandLineTool([ config.tempDir, '-v1' ], function (err, stdout, stderr) {
                        test.strictEqual(stdout.split('\n').length, 3);
                        callback();
                    });
                },
                function (callback) {
                    utils.execCommandLineTool([ config.tempDir, '-v2' ], function (err, stdout, stderr) {
                        test.strictEqual(stdout.split('\n').length, 4);
                        callback();
                    });
                }
            ], function () {
                test.done();
            });
        });
    }

};
