var Async = require('async'),
    Fs = require('fs'),
    Glob = require('glob'),
    Path = require('path'),
    RawSource = require('webpack-core/lib/RawSource');

module.exports = function(options) {
  this.options = options;
};

module.exports.prototype.apply = function(compiler) {
  var options = this.options;
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('additional-assets', function(callback) {
      // Copy over any include files to the build output target
      var includesDir = options.includesDir || './styles/includes/**/*';
      includesDir = Path.resolve(compiler.options.context, includesDir);

      Glob.glob(includesDir, function(err, files) {
        if (err) {
          return callback(err);
        }

        Async.forEach(files, function(file, callback) {
            Fs.readFile(file, function(err, data) {
              if (err) {
                // If the file suddenly disappeared, then the error should be fatal as this
                // is unexpected, being previously returned from the glob API.
                return callback(err);
              }

              file = Path.relative(compiler.options.context, file);
              compilation.assets[options.remap ? options.remap(file) : file] = new RawSource(data);

              callback();
            });
          },
          callback);
      });
    });
  });
};
