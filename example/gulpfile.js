/* global require */

var gulp = require('gulp'),
    cssGs = require('../index.js');

gulp.task('replace', function() {
    return gulp.src('./src/**/*.*')
        .pipe(cssGs({
            logProgress: true,
            //algorithm: 'average',
            additionalMethods: [
                {
                    find: /img\/path/ig,
                    replace: function() {
                        return 'hi';
                    }
                },
                {
                    find: /lalala/ig,
                    replace: function() {
                        return 'ho';
                    }
                },
                {
                    find: 'hahaha',
                    replace: 'hihihi'
                }
            ]
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['replace']);
