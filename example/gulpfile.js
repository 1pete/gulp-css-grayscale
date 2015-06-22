/* global require */

var gulp = require('gulp'),
    gs = require('../index.js');

gulp.task('gs', function() {
    return gulp.src('./src/**/*.*')
        .pipe(gs({
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

gulp.task('default', ['gs']);
