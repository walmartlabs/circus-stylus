var _ = require('lodash'),
    StylusIncludesPlugin = require('./plugins/stylus-includes');

module.exports.config = function(additions) {
  var options = additions.stylus || {},
      defines = options.defines || {};

  return _.defaults({
    module: _.defaults({
      loaders: loaders(defines, additions.module && additions.module.loaders)
    }, additions.module),

    plugins: plugins(options, additions.plugins)
  }, additions);
};

function loaders(stylusDefines, additions) {
  var base = [
    {
      test: /\.styl$/,
      loader: require.resolve('stylus-loader')
          + '?' + JSON.stringify({define: stylusDefines, 'resolve url': true})
    }
  ];

  return additions ? base.concat(additions) : base;
}

function plugins(options, additions) {
  var base = [
    new StylusIncludesPlugin(options)
  ];

  return additions ? base.concat(additions) : base;
}
