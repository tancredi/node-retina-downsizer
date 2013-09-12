
var im = require('imagemagick');

module.exports = function (target, callback) {
    var parts = target.split('.'),
        ext = parts[parts.length - 1],
        outName;

    if (target.substr(target.length - ext.length - 4, 3).toLowerCase() !== '@2x') {
        return callback(new Error('Filename not affixed .@2x'), null);
    }

    outName = target.substr(0, target.length - ext.length - 4, 3) + '.' + ext;

    im.identify(target, function (err, stats) {
        var options;

        if (err) {
            return callback(err, null);
        }

        options = {
            srcPath: target,
            dstPath: outName,
            width: Math.round(stats.width / 2),
            height: Math.round(stats.height / 2)
        };

        im.resize(options, function (err, stdout, stderr){
            if (typeof callback === 'function') {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, outName);
                }
            }
        });
    });
};