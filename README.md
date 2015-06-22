gulp-image-grayscale
===========

## Description

Converts css to grayscale version

## Important!!1

BETA!!1

## todo

* Tests
* Comments

## Installation

```bash
$ npm install gulp-css-grayscale
```

## Example

```javascript
var gulp = require('gulp');
var gs = require('gulp-css-grayscale');

gulp.task('gs-css', function() {
    return gulp.src('./src/**/*.*')
        .pipe(gs({
            logProgress: false,
            additionalMethods: [
                {
                    find: /img\/path/ig,
                    replace: function() {
                        console.log(arguments);
                        return 'sth';
                    }
                },
                {
                    find: /some string/ig,
                    replace: function() {
                        console.log(arguments);
                        return 'sth';
                    }
                },
                {
                    find: 'some string',
                    replace: 'other string'
                }
            ]
        }))
        .pipe(gulp.dest('./dest'));
});

gulp.task('default', ['gs-css']);
```

## Options

```javascript
var defaults = {
    
    algorithm: 'lightness',

    logProgress: false

};
```

### algorithm

```text
average -> (r + g + b) / 3;
luminosity -> 0.21 * r + 0.72 * g + 0.07 * b;
lightness (default) -> 0.5 * (max(r, g, b) + min(r, g, b));
own -> algorithm: function(r, g, b) {
    return r * 0.25 + g * 0.5 + b * 0.25;
}
```
