/* global require, Buffer, module */

var
  through = require('through2'),
  merge = require('lodash.merge'),
  convert = require('cmnjs/color/convert'),
  regExp = require('cmnjs/color/regExp'),
  namedColors = require('cmnjs/color/data/named'),
  methods = convert.rgbToGray,
  peformance = require('performance-now'),
  util = require('gulp-util'),
  chalk = util.colors,
  packageJson = require('./package.json'),
  parseInt10 = require('cmnjs/number/parseInt10'),

  moduleName = packageJson.name,
  version = packageJson.version,

  slice = Array.prototype.slice,

  defaults = {
    algorithm: 'lightness',
    logProgress: false,
    additionalMethods: []
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
  }

  return through.obj(function(file, enc, callback) {

    var
      name = file.relative,
      log = util.log.bind(util, chalk.yellow(moduleName + '@' + version),
        chalk.blue(name)),
      t1,
      i,
      count,
      string;

    // pass file through
    if (file.isNull() || file.isDirectory()) {

      if (options.logProgress) {
        log(chalk.blue('File is null/directory - just passing it through'));
      }

      this.push(file);
      return callback();

    }

    // no support for streams
    if (file.isStream()) {

      log(chalk.red('Streams are not supported.'));

      return callback();

    }

    if (file.isBuffer()) {

      if (options.logProgress) {
        t1 = peformance();
      }

      string = String(file.contents);

      string = string.replace(regExp.hex, function(match) {
        return convert.hexToGray(match, method);
      })
        .replace(regExp.named, function(match, position, css) {
          var
            char = css.charAt(position - 1);
          return /\.|#/.test(char) ? match
            : convert.hexToGray(namedColors[match], method);
        })
        .replace(regExp.rgba, function() {

          var
            args = slice.call(arguments, 1, arguments.length - 2),
            gray = method.apply(null, args.slice(1).map(parseInt10));

          gray = args[0] + '(' + gray + ',' + gray + ',' + gray + '';
          if (args[0] === 'rgb') {
            return gray + ')';
          } else {
            return gray + ',' + parseFloat(args[5]).toString()
                .replace('0.', '.') + ')';
          }

        })
        .replace(regExp.hsla, function() {
          var
            args = slice.call(arguments, 1, arguments.length - 2),
            gray = convert.hslToGray(args[1], args[2], args[3], method);
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
        log(chalk.magenta((peformance() - t1).toFixed(3) + ' ms'));
      }

      return callback();

    } else {

      log(chalk.red('No buffer'));

      return callback();

    }

  });

}

module.exports = gulpCssGrayscale;
