# circus-stylus

Implments Stylus compilation that is aware of [Circus][] component dependencies when resolving includes.

## Usage

Generally follows the [stylus-loader][] behaviors, with the distinction that files indented for direct imports within other components after the source component has been built.

### Configuration

Used as a preprocessor for the `Circus.config` method:

```javascript
var Circus = require('circus'),
    CircusStylus = require('circus-stylus');

var config = {};
config = CircusStylus.config(config);
config = Circus.config(config);
```

circus-stylus defines optional config values on the `stylus` config key. These are:

- `defines`: Key/value pair defining stylus variables to be used. These defines do not apply to copied include files, which are copied verbatim.
- `includeDir`: Path to export for stylus includes. Content in this directory will be copied to the build output directory and be made available to stylus include content. Defaults to `./src/lib/styles/includes/**/*.styl`
- `remap`: Optional function that is passed the source file name and may return the build destination file name. Default behavior is to remap relative to the project root in a 1 to 1 manner.

[circus]: https://github.com/walmartlabs/circus
[stylus-loader]: https://github.com/shama/stylus-loader

