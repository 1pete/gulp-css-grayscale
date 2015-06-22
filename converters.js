/* global module */

module.exports = {

    debug: function(arr) {

        var logMeArr = [];

        arr.forEach(function(e) {
            logMeArr.push(e, typeof e);
        });

        console.log.apply(console, logMeArr);

    },

    hslToRgb: function(h, s, l) {

        var r,
            g,
            b,
            p,
            q,
            hue2rgb;

        h /= 360;
        s /= 100;
        l /= 100;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {

            q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            p = 2 * l - q;

            hue2rgb = function(p2, q2, t) {
                if (t < 0) {
                    t += 1;
                }
                if (t > 1) {
                    t -= 1;
                }
                if (t < 1 / 6) {
                    return p2 + (q2 - p2) * 6 * t;
                }
                if (t < 1 / 2) {
                    return q2;
                }
                if (t < 2 / 3) {
                    return p2 + (q2 - p2) * (2 / 3 - t) * 6;
                }
                return p2;
            };
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];

    },

    rgbToHsl: function(r, g, b) {

        r /= 255;
        g /= 255;
        b /= 255;

        var max = Math.max(r, g, b),
            min = Math.min(r, g, b),
            d,
            h,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            d = max - min;
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

        return [
            Math.round(h * 360),
            Math.round(s * 100),
            Math.round(l * 100)
        ];
    },

    rgbToHex: function(r, g, b) {
        var hex =
            ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
            hex = hex[0] + hex[2] + hex[4];
        }
        return '#' + hex;
    },

    hexToRgb: function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            result;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },

    // main
    hexToGray: function(hex, method) {
        var rgb = this.hexToRgb(hex),
            calculatedColor = method(rgb[0], rgb[1], rgb[2]);

        //this.debug(rgb);

        return this
            .rgbToHex(calculatedColor, calculatedColor, calculatedColor);
    },

    // main
    hslToGray: function(h, s, l, method) {
        var rgb = this.hslToRgb(h, s, l),
            calculatedColor = method(rgb[0], rgb[1], rgb[2]);

        //this.debug(rgb);

        return this
            .rgbToHsl(calculatedColor, calculatedColor, calculatedColor);
    }

};
