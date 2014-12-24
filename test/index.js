var Circus = require('circus'),
    CircusStylus = require('../lib'),
    Glob = require('glob'),
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
        includesDir: __dirname + '/fixtures/styles/includes/**/*.styl',
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

      expect(Object.keys(compilation.assets)).to.eql([
        'bundle.js',
        '0.bundle.css',
        'circus.json',
        'test/fixtures/styles/includes/red.styl',
        'bundle.js.map'
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
        includesDir: __dirname + '/fixtures/styles/includes/**/*.styl',
        remap: function(file) {
          expect(file).to.equal('test/fixtures/styles/includes/red.styl');
          return 'styles/includes/red.styl';
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

      expect(Object.keys(compilation.assets)).to.eql([
        'bundle.js',
        '0.bundle.css',
        'circus.json',
        'styles/includes/red.styl',
        'bundle.js.map'
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

      expect(Object.keys(compilation.assets)).to.eql(['bundle.js', '0.bundle.css', 'circus.json', 'bundle.js.map']);

      // Verify the actual css content
      var output = Fs.readFileSync(outputDir + '/0.bundle.css').toString();
      expect(output).to.match(/\.foo\s*\{/);
      expect(output).to.match(/\.android\s*\{/);

      done();
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
          includesDir: __dirname + '/fixtures/styles/includes/**/*.styl'
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
          includesDir: __dirname + '/fixtures/styles/includes/**/*.styl'
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
