var gulp = require('gulp');
var cssGs = require('../index.js');

gulp.task('replace', function() {
    return gulp.src('./src/**/*.*')
        .pipe(cssGs({
            logProgress: false,
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
