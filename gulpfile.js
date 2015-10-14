var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');


gulp.task('jshint', function () {
  return gulp.src('./lib/*.js')
    .pipe(jshint({
      predef: ['require', 'module'],
      node: true,
      esnext: true
    }))
    .pipe(jshint.reporter('default'));
});


gulp.task('test', function (cb) {
  gulp.src(['./lib/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      gulp.src(['./test/*.js'])
        .pipe(mocha({
          reporter: 'spec'
        }))
        .pipe(istanbul.writeReports({
          reporters: ['text', 'text-summary', 'html']
        }))
        .pipe(istanbul.enforceThresholds({
          thresholds: {
            global: 90
          }
        })).on('end', cb);
    });
});

gulp.task('default', ['jshint', 'test']);
