/* global require, Buffer, module */

var
  through = require('through2'),
  merge = require('lodash.merge'),
  colors = require('chalk'),

  data = require('./regexp-and-data'),
  converters = require('./converters'),

  moduleName = module.filename.split('/').splice(-2, 1)[0],

  slice = Array.prototype.slice,

  defaults = {
    algorithm: 'lightness',
    logProgress: false,
    additionalMethods: []
  },
  methods = {
    average: function(r, g, b) {
      return Math.round((r + g + b) / 3);
    },
    luminosity: function(r, g, b) {
      return Math.round(0.21 * r + 0.72 * g + 0.07 * b);
    },
    lightness: function(r, g, b) {
      return Math.round(0.5 * (Math.max(r, g, b) + Math.min(r, g, b)));
    }
  };

function gulpCssGrayscale(opts) {

  var
    options = merge({}, defaults, opts),
    replacers = options.additionalMethods,
    method;

  // console.log(opts);

  if (typeof options.algorithm === 'function') {
    method = options.algorithm;
  } else if (methods[options.algorithm]) {
    method = methods[options.algorithm];
  } else {
    // 3 warunek z automatu
    method = methods.lightness;
  }

  return through.obj(function(file, enc, callback) {

    var
      name = file.relative,
      t1,
      i,
      count,
      string;

    // pass file through
    if (file.isNull() || file.isDirectory()) {

      this.push(file);
      return callback();

    }

    // no support for streams
    if (file.isStream()) {

      console.log(
        '   ',
        colors.yellow(moduleName),
        name,
        colors.red(
          'Streams are not supported.'
        )
      );
      return callback();

    }

    if (file.isBuffer()) {

      if (options.logProgress) {
        t1 = Date.now();
      }

      string = String(file.contents);

      string = string.replace(data.reHex, function(match) {
        return converters.hexToGray(match, method);
      })
        .replace(data.reNamed, function(match, position, css) {
          var
            char = css.charAt(position - 1);
          return /\.|#/.test(char) ? match :
            converters.hexToGray(data.colors[match], method);
        })
        .replace(data.reRgba, function() {
          var
            args = slice.call(arguments, 1, arguments.length - 2),
            gray = method(
              parseInt(args[1], 10),
              parseInt(args[2], 10),
              parseInt(args[3], 10)
            );

          gray = args[0] + '(' + gray + ',' + gray + ',' + gray + '';
          if (args[0] === 'rgb') {
            return gray + ')';
          } else {
            return gray + ',' + parseFloat(args[5]).toString()
                .replace('0.', '.') + ')';
          }

        })
        .replace(data.reHsla, function() {
          var
            args = slice.call(arguments, 1, arguments.length - 2),
            gray =
              converters
                .hslToGray(args[1], args[2], args[3], method);
          gray = args[0] + '(' + gray[0] + ',' + gray[1] +
            '%,' + gray[2] + '%';
          if (args[0] === 'hsl') {
            return gray + ')';
          } else {
            return gray + ',' + parseFloat(args[5]).toString()
                .replace('0.', '.') + ')';
          }
        });

      for (i = 0, count = replacers.length; i < count; i++) {
        string =
          string.replace(replacers[i].find, replacers[i].replace);
      }

      file.contents = new Buffer(string);

      this.push(file);

      if (options.logProgress) {
        console.log(
          '   ',
          colors.yellow(moduleName),
          name,
          colors.magenta((Date.now() - t1).toFixed() + ' ms')
        );
      }

      return callback();

    } else {

      console.log(
        '   ',
        colors.yellow(moduleName),
        name,
        colors.red('No buffer')
      );
      return callback();

    }

  });
}

module.exports = gulpCssGrayscale;
