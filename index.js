/* global require, Buffer, module */


var through = require('through2');
var merge = require('lodash.merge');

var colors = require('./colors');

var slice = Array.prototype.slice;

/*
 additionalMethods: [
 {
 find: /img\/path/ig,
 replace: function() {
 console.log(arguments);
 return 'sth';
 }
 }
 ]
 */

var defaults = {
        algorithm: 'lightness',
        logProgress: true,
        additionalMethods: []
    },
    methods = {
        average: function (r, g, b) {
            return Math.round((r + g + b) / 3);
        },
        luminosity: function (r, g, b) {
            return Math.round(0.21 * r + 0.72 * g + 0.07 * b);
        },
        lightness: function (r, g, b) {
            return Math.round(0.5 * (Math.max(r, g, b) + Math.min(r, g, b)));
        }
    };

var reRgba = /(rgba?)\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*([0-9\.]+))?\s*\)/ig;

var reHsla = /(hsla?)\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*%\s*,\s*(\d{1,3})\s*%\s*(\s*,\s*([0-9\.]+))?\s*\)/ig;

var reHex = /#([a-f0-9]{6}|[a-f0-9]{3})/ig;

var reNamed = /\baqua\b|\bdarkgrey\b|\bdarkslategrey\b|\bdimgrey\b|\bfuchsia\b|\bgrey\b|\blightgrey\b|\blightslategrey\b|\bslategrey\b|\baliceblue\b|\bantiquewhite\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b|\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b|\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b|\bdarkslateblue\b|\bdarkslategray\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bgainsboro\b|\bghostwhite\b|\bgold\b|\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b|\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b|\blightgreen\b|\blightgray\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b|\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b|\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b|\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b|\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b|\brebeccapurple\b|\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b|\bskyblue\b|\bslateblue\b|\bslategray\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b|\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite(?!-)\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b/ig;

function hslToRgb(h, s, l) {
    var r,
        g,
        b;

    h /= 360;
    s /= 100;
    l /= 100;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsl(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;

    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h,
        s,
        l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHex(r, g, b) {
    var hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        hex = hex[0] + hex[2] + hex[4];
    }
    return '#' + hex;
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function hexToGray(hex, method) {
    var rgb = hexToRgb(hex),
        calculatedColor = method(rgb[0], rgb[1], rgb[2]);
    return rgbToHex(calculatedColor, calculatedColor, calculatedColor);
}

function hslToGray(h, s, l, method) {
    var rgb = hslToRgb(h, s, l),
        calculatedColor = method(rgb[0], rgb[1], rgb[2]);
    return rgbToHsl(calculatedColor, calculatedColor, calculatedColor);
}

function gulpCssGrayscale(opts) {

    var options = merge({}, defaults, opts),
        replacers = options.additionalMethods,
        method;

    // console.log(opts);

    if (typeof options.algorithm === 'function') {
        method = options.algorithm;
    } else if (methods[options.algorithm]) {
        method = methods[options.algorithm];
    } else {
        method = methods.lightness;
    }

    return through.obj(function (file, enc, callback) {

        var name = file.relative,
            string;

        // pass file through
        if (file.isNull() || file.isDirectory()) {

            this.push(file);
            return callback();

        }

        // no support for streams
        if (file.isStream()) {

            console.log('Streams are not supported.');
            return callback();

        }

        if (file.isBuffer()) {

            if (options.logProgress) {
                console.time(name + ' | time');
            }

            string = String(file.contents);

            string = string.replace(reHex, function (match) {
                return hexToGray(match, method);
            })
                .replace(reNamed, function (match) {
                    return hexToGray(colors[match], method);
                })
                .replace(reRgba, function () {
                    var args = slice.call(arguments, 1, arguments.length - 2),
                        gray = method(args[1], args[2], args[3]);
                    gray = args[0] + '(' + gray + ',' + gray + ',' + gray + '';
                    if (args[0] === 'rgb') {
                        return gray + ')';
                    } else {
                        return gray + ',' +parseFloat(args[5]).toString()
                                .replace('0.', '.') + ')';
                    }

                })
                .replace(reHsla, function () {
                    var args = slice.call(arguments, 1, arguments.length - 2),
                        gray = hslToGray(args[1], args[2], args[3], method);
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
                string = string.replace(replacers[i].find, replacers[i].replace);
            }

            file.contents = new Buffer(string);

            this.push(file);

            if (options.logProgress) {
                console.timeEnd(name + ' | time');
            }

            return callback();

        } else {

            console.log('Ignoring ' + name + ' -> no buffer');
            return callback();

        }

    });
}

module.exports = gulpCssGrayscale;
