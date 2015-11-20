/* global require, Buffer, module */

var through = require('through2');
var merge = require('lodash.merge');
var convert = require('cmnjs/color/convert');
var regExp = require('cmnjs/color/regExp');
var namedColors = require('cmnjs/color/data/named');
var peformance = require('performance-now');
var util = require('gulp-util');
var packageJson = require('./package.json');
var parseInt10 = require('cmnjs/number/parseInt10');

var methods = convert.rgbToGray;
var chalk = util.colors;
var moduleName = packageJson.name;
var version = packageJson.version;

var slice = Array.prototype.slice;

var defaults = {
  algorithm: 'lightness',
  logProgress: false,
  additionalMethods: []
};

function gulpCssGrayscale(opts) {

  var options = merge({}, defaults, opts);
  var replacers = options.additionalMethods;
  var method;

  // console.log(opts);

  if (typeof options.algorithm === 'function') {
    method = options.algorithm;
  } else if (methods[options.algorithm]) {
    method = methods[options.algorithm];
  }

  return through.obj(function(file, enc, callback) {

    var name = file.relative;
    var fileString;
    var log = util.log.bind(util, chalk.yellow(moduleName + '@' + version),
      chalk.blue(name));
    var t1;

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

      fileString = String(file.contents);

      fileString = fileString.replace(regExp.hex, function(match) {
        return convert.hexToGray(match, method);
      })
        .replace(regExp.named, function(match, position, css) {
          var char = css.charAt(position - 1);
          return /\.|#/.test(char) ? match
            : convert.hexToGray(namedColors[match], method);
        })
        .replace(regExp.rgba, function() {

          var args = slice.call(arguments, 1, arguments.length - 2);
          var gray = method.apply(null, args.slice(1).map(parseInt10));

          gray = args[0] + '(' + gray + ',' + gray + ',' + gray + '';
          if (args[0] === 'rgb') {
            return gray + ')';
          } else {
            return gray + ',' + parseFloat(args[5]).toString()
              .replace('0.', '.') + ')';
          }

        })
        .replace(regExp.hsla, function() {
          var args = slice.call(arguments, 1, arguments.length - 2);
          var gray = convert.hslToGray(args[1], args[2], args[3], method);
          gray = args[0] + '(' + gray[0] + ',' + gray[1] +
            '%,' + gray[2] + '%';
          if (args[0] === 'hsl') {
            return gray + ')';
          } else {
            return gray + ',' + parseFloat(args[5]).toString()
                .replace('0.', '.') + ')';
          }
        });

      for (var i = 0, count = replacers.length; i < count; i++) {
        fileString =
          fileString.replace(replacers[i].find, replacers[i].replace);
      }

      file.contents = new Buffer(fileString);

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
