const gulp = require('gulp');
const jshint = require('gulp-jshint');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const browserify = require('gulp-browserify');
const rename = require('gulp-rename');


gulp.task('jshint', function() {
	return gulp.src(['./lib/*.js', './index.js'])
		.pipe(jshint({
			predef: ['require', 'module'],
			node: true,
			esnext: true
		}))
		.pipe(jshint.reporter('default'));
});


gulp.task('test', function(cb) {
	gulp.src(['./lib/*.js', './index.js'])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function() {
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


gulp.task('browserify', function() {
	gulp.src('./index.js')
		.pipe(browserify({
			require: ['superagent', ['./index.js', {
				expose: 'superagent-extend'
			}]]
		}))
		.pipe(rename('superagent-extend.js'))
		.pipe(gulp.dest('./'));
});

gulp.task('default', ['jshint', 'test', 'browserify']);