#! /usr/bin/env node

var opti = require('optimist'),
	RetinaDownsizer = require('../index.js'),
	color = require('cli-color'),
	downsizer, argv;

argv = opti.usage('Downsize retina images.\nUsage: $0')

	.alias('v', 'verbose')
    .describe('v', 'Verbosity level. -v 0: Silent, -v 1: Log start and end, -v 2: (Default) Log each operation.')

    .boolean('r')
    .alias('r', 'recursive')
    .describe('r', 'Use to fetch and downsize all assets in a directory trees')

    .boolean('h')
    .alias('h', 'help')
    .describe('h', 'Show usage info')

    .alias()

    .argv;

if (argv.h) { // Show help

	opti.showHelp(console.log);

} else if (!argv._.length) {

	console.error(color.red('No target directories / images specified. Use --help for usage.'));

} else { // Run

	downsizer = new RetinaDownsizer({
		targets: argv._,
		verbosity: (typeof argv.v === 'number' ? argv.v : 2),
		depth: (argv.r ? 0 : 1)
	});

	downsizer.run();

}
