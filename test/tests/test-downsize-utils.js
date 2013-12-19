var utils = require('../test-utils'),
    config = require('../config'),
    downsizeImage = require('../../utils/downsizeImage.js'),
    im = require('imagemagick'),
    path = require('path'),
    async =require('async');

module.exports = {
    setUp: utils.createAssetDir,
    tearDown: utils.destroyAssetsDir,

    'Test downsize of a single image': function (test) {
        utils.createTestImage(200, 200, 'test/sample@2x.png', function (filePath) {
            im.identify(filePath, function (err, features) {
                if (err) { throw err; }

                test.strictEqual(features.width, 200);
                test.strictEqual(features.height, 200);

                downsizeImage(filePath, 1, function (err, newFile) {
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

    'Test downsize with different densities': function (test) {
        utils.createTestImage(200, 200, 'foo@2x.png', function (filePath) {

            async.parallel([

                function (callback) {
                    downsizeImage(filePath, 1, function () {
                        im.identify(path.resolve(config.tempDir, 'foo.png'), function (err, features) {
                            if (err) { throw err; }

                            test.strictEqual(features.width, 100);
                            test.strictEqual(features.height, 100);

                            callback();
                        });
                    });
                },

                function (callback) {
                    downsizeImage(filePath, 1.5, function () {
                        im.identify(path.resolve(config.tempDir, 'foo@1.5.png'), function (err, features) {
                            if (err) { throw err; }

                            test.strictEqual(features.width, 150);
                            test.strictEqual(features.height, 150);

                            callback();
                        });
                    });
                },

            ], function () {
                test.done();
            });

        });
    },

    'Test downsize error on lack of retina suffix': function (test) {
        utils.createTestImage(200, 200, 'test/no-suffix.png', function (filePath) {

            test.throws(function () {
                downsizeImage(filePath, 1, function (err) {
                    if (err) { throw err; }
                });
            }, Error);

            test.done();
        });
    },

    'Test downsize flooring on odd sizes': function (test) {
        utils.createTestImage(199, 200, 'aaa@2x.png', function (filePath) {

            downsizeImage(filePath, 1, function (err, newFile) {
                if (err) { throw err; }

                im.identify(newFile, function (err, features) {
                    test.strictEqual(features.width, 100);
                    test.strictEqual(features.height, 100);

                    test.done();
                });
            });
        });
    }

};