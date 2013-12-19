var RetinaDownsizer = require('../../index.js');

module.exports = {

    'Test class methods': function (test) {
        test.equals(typeof RetinaDownsizer, 'function');
        test.notStrictEqual(typeof RetinaDownsizer.prototype.run, 'undefined');

        test.done();
    },

    'Test default configuration': function (test) {
        var instance;

        test.doesNotThrow(function () {
            instance = new RetinaDownsizer();
        }, 'Fails initialising without options');

        test.strictEqual(instance.targets, './');
        test.strictEqual(instance.extensions.length, 4);
        test.strictEqual(instance.log, console.log);
        test.strictEqual(instance.verbosity, 2);
        test.strictEqual(instance.depth, 0);
        test.ok(instance.densities.length);
        test.strictEqual(instance.densities[0], 1);

        test.done();
    },

    'Test custom configuration': function (test) {
        var logFunction = function () {},
            instance = new RetinaDownsizer({
                targets: [ './foo', './bar' ],
                extensions: [ 'gif' ],
                log: logFunction,
                verbosity: 1,
                depth: 2,
                densities: [ 1.5, 1.8 ]
            });

        test.strictEqual(instance.targets[0], './foo');
        test.strictEqual(instance.targets[1], './bar');
        test.strictEqual(instance.extensions.length, 1);
        test.strictEqual(instance.log, logFunction);
        test.strictEqual(instance.verbosity, 1);
        test.strictEqual(instance.depth, 2);
        test.strictEqual(instance.densities.length, 2);

        test.done();
    },

};