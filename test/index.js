var Circus = require('circus'),
    CircusStylus = require('../lib'),
    Glob = require('glob'),
    Path = require('path'),
    webpack = require('webpack');

var expect = require('chai').expect,
    Fs = require('fs'),
    Sinon = require('sinon'),
    temp = require('temp'),
    path = require('path');

describe('loader integration', function() {
  var outputDir;

  beforeEach(function(done) {
    temp.mkdir('loader-plugin', function(err, dirPath) {
      if (err) {
        throw err;
      }

      outputDir = dirPath;

      done();
    });
  });
  afterEach(function() {
    temp.cleanupSync();
  });

  describe('#config', function() {
    it('should extend config', function() {
      var config = CircusStylus.config({
        module: {
          loaders: [2]
        },
        plugins: [1]
      });

      expect(config.module.loaders.length).to.equal(2);
      expect(config.module.loaders[1]).to.equal(2);
      expect(config.plugins.length).to.equal(2);
      expect(config.plugins[1]).to.equal(1);
    });
  });

  it('should compile stylus into external css files', function(done) {
    var entry = path.resolve(__dirname + '/fixtures/stylus.js');

    var config = {
      entry: entry,
      output: {
        path: outputDir
      },

      stylus: {
        includesDir: __dirname + '/fixtures/styles/includes/**/*',
        defines: {
          $isAndroid: false
        }
      }
    };
    config = CircusStylus.config(config);
    config = Circus.config(config);

    webpack(config, function(err, status) {
      expect(err).to.not.exist;

      var compilation = status.compilation;
      expect(compilation.errors).to.be.empty;
      expect(compilation.warnings).to.be.empty;

      expect(Object.keys(compilation.assets).sort()).to.eql([
        '0.bundle.css',
        '0.bundle.css.map',
        'bootstrap.js',
        'bootstrap.js.map',
        'bundle.js',
        'bundle.js.map',
        'circus.json',
        'test/fixtures/styles/includes/red.styl',
        'test/fixtures/styles/includes/url.gif'
      ]);

      // Verify the actual css content
      var output = Fs.readFileSync(outputDir + '/0.bundle.css').toString();
      expect(output).to.match(/\.foo\s*\{/);
      expect(output).to.not.match(/\.android\s*\{/);

      var input = Fs.readFileSync(__dirname + '/fixtures/styles/includes/red.styl').toString();
      output = Fs.readFileSync(outputDir + '/test/fixtures/styles/includes/red.styl').toString();
      expect(output).to.equal(input);

      done();
    });
  });
  it('should remap include files', function(done) {
    var entry = path.resolve(__dirname + '/fixtures/stylus.js');

    var config = {
      entry: entry,
      output: {
        path: outputDir
      },

      stylus: {
        includesDir: __dirname + '/fixtures/styles/includes/**/*',
        remap: function(file) {
          expect(file).to.match(/test\/fixtures\/styles\/includes\//);
          return 'styles/includes/' + Path.basename(file);
        },
        defines: {
          $isAndroid: false
        }
      }
    };
    config = CircusStylus.config(config);
    config = Circus.config(config);

    webpack(config, function(err, status) {
      expect(err).to.not.exist;

      var compilation = status.compilation;
      expect(compilation.errors).to.be.empty;
      expect(compilation.warnings).to.be.empty;

      expect(Object.keys(compilation.assets).sort()).to.eql([
        '0.bundle.css',
        '0.bundle.css.map',
        'bootstrap.js',
        'bootstrap.js.map',
        'bundle.js',
        'bundle.js.map',
        'circus.json',
        'styles/includes/red.styl',
        'styles/includes/url.gif'
      ]);

      var input = Fs.readFileSync(__dirname + '/fixtures/styles/includes/red.styl').toString(),
          output = Fs.readFileSync(outputDir + '/styles/includes/red.styl').toString();
      expect(output).to.equal(input);

      done();
    });
  });
  it('should define vars', function(done) {
    var entry = path.resolve(__dirname + '/fixtures/stylus.js');

    var config = {
      entry: entry,
      output: {
        path: outputDir
      },

      stylus: {
        defines: {
          $isAndroid: true
        }
      }
    };
    config = CircusStylus.config(config);
    config = Circus.config(config);

    webpack(config, function(err, status) {
      expect(err).to.not.exist;


      var compilation = status.compilation;
      expect(compilation.errors).to.be.empty;
      expect(compilation.warnings).to.be.empty;

      expect(Object.keys(compilation.assets).sort()).to.eql([
        '0.bundle.css',
        '0.bundle.css.map',
        'bootstrap.js',
        'bootstrap.js.map',
        'bundle.js',
        'bundle.js.map',
        'circus.json'
      ]);

      // Verify the actual css content
      var output = Fs.readFileSync(outputDir + '/0.bundle.css').toString();
      expect(output).to.match(/\.foo\s*\{/);
      expect(output).to.match(/\.android\s*\{/);

      done();
    });
  });

  it('should import from components', function(done) {
    var vendorEntry = path.resolve(__dirname + '/fixtures/stylus.js'),
        entry = path.resolve(__dirname + '/fixtures/require.js');

    var config = {
      context: __dirname,
      entry: vendorEntry,
      output: {
        component: 'vendor',

        path: outputDir + '/vendor',
        filename: 'vendor.js'
      },
      stylus: {
        includesDir: __dirname + '/fixtures/styles/includes/**/*',
        remap: function(file) {
          return file.replace(/fixtures\//, '');
        }
      }
    };
    config = CircusStylus.config(config);
    config = Circus.config(config);

    webpack(config, function(err, status) {
      expect(err).to.not.exist;

      var compilation = status.compilation;
      expect(compilation.errors).to.be.empty;
      expect(compilation.warnings).to.be.empty;

      var config = {
        entry: entry,

        output: {
          path: outputDir
        },

        resolve: {
          modulesDirectories: [
            outputDir
          ]
        }
      };
      config = CircusStylus.config(config);
      config = Circus.config(config);

      webpack(config, function(err, status) {
        expect(err).to.not.exist;

        var compilation = status.compilation;
        expect(compilation.errors).to.be.empty;
        expect(compilation.warnings).to.be.empty;

        var output = Fs.readFileSync(outputDir + '/0.bundle.css').toString();
        expect(output).to.match(/\.red \{/);
        expect(output).to.match(/url\("d41d8cd98f00b204e9800998ecf8427e.gif"\)/);

        done();
      });
    });
  });
  it('should import published urls from components', function(done) {
    var vendorEntry = path.resolve(__dirname + '/fixtures/stylus.js'),
        entry = path.resolve(__dirname + '/fixtures/require.js');

    var config = {
      context: __dirname,
      entry: vendorEntry,
      output: {
        component: 'vendor',

        path: outputDir + '/vendor',
        filename: 'vendor.js'
      },
      stylus: {
        includesDir: __dirname + '/fixtures/styles/includes/**/*',
        remap: function(file) {
          return file.replace(/fixtures\//, '');
        }
      }
    };
    config = CircusStylus.config(config);
    config = Circus.config(config);

    webpack(config, function(err, status) {
      expect(err).to.not.exist;

      var compilation = status.compilation;
      expect(compilation.errors).to.be.empty;
      expect(compilation.warnings).to.be.empty;

      var output = JSON.parse(Fs.readFileSync(outputDir + '/vendor/circus.json'));
      output.published['d41d8cd98f00b204e9800998ecf8427e.gif'] = 'd41d8cd98f00b204e9800998ecf8427e.foo';
      Fs.writeFileSync(outputDir + '/vendor/circus.json', JSON.stringify(output));

      var config = {
        entry: entry,

        output: {
          path: outputDir
        },

        resolve: {
          modulesDirectories: [
            outputDir
          ]
        }
      };
      config = CircusStylus.config(config);
      config = Circus.config(config);

      webpack(config, function(err, status) {
        expect(err).to.not.exist;

        var compilation = status.compilation;
        expect(compilation.errors).to.be.empty;
        expect(compilation.warnings).to.be.empty;

        var output = Fs.readFileSync(outputDir + '/0.bundle.css').toString();
        expect(output).to.match(/\.red \{/);
        expect(output).to.match(/url\("d41d8cd98f00b204e9800998ecf8427e.foo"\)/);

        done();
      });
    });
  });

  describe('StylusIncludePlugin', function() {
    var sandbox;
    beforeEach(function() {
      sandbox = Sinon.sandbox.create({
        useFakeTimers: false,
        useFakeServer: false
      });
    });
    afterEach(function() {
      sandbox.restore();
    });

    it('should handle glob errors', function(done) {
      var err;
      sandbox.stub(Glob, 'glob', function(dir, callback) {
        err = new Error('it failed');
        callback(err);
      });

      var entry = path.resolve(__dirname + '/fixtures/stylus.js');

      var config = {
        entry: entry,
        output: {
          path: outputDir
        },

        stylus: {
          includesDir: __dirname + '/fixtures/styles/includes/**/*'
        }
      };
      config = CircusStylus.config(config);
      config = Circus.config(config);

      webpack(config, function(_err, status) {
        expect(_err).to.equal(err);
        expect(status).to.not.exist;

        done();
      });
    });

    it('should handle read errors', function(done) {
      var original = Fs.readFile,
          err;
      sandbox.stub(Fs, 'readFile', function(file, callback) {
        if (/red.styl/.test(file)) {
          err = new Error('it failed');
          callback(err);
        } else {
          original.call(Fs, file, callback);
        }
      });

      var entry = path.resolve(__dirname + '/fixtures/stylus.js');

      var config = {
        entry: entry,
        output: {
          path: outputDir
        },

        stylus: {
          includesDir: __dirname + '/fixtures/styles/includes/**/*'
        }
      };
      config = CircusStylus.config(config);
      config = Circus.config(config);

      webpack(config, function(_err, status) {
        expect(_err).to.equal(err);
        expect(status).to.not.exist;

        done();
      });
    });
  });
});
