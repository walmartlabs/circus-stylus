/*
  gulpfile.js
  ===========
  Each task has been broken out into its own file in build/tasks. Any file in that folder gets
  automatically required by the loop in ./gulp/index.js (required below).

  To add a new task, simply add a new task file to ./build/tasks.
*/

var gulp = require('gulp'),

    jscs = require('gulp-jscs'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),

    istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha');

var source = ['lib/**/*.js'];
var mochaTests = [
  'test/**/*.js',
  '!test/client/**/*.js',
  '!test/fixtures/**/*.js'
];

gulp.task('jshint', function() {
  return gulp.src(source)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('jscs', function() {
  return gulp.src(source)
    .pipe(jscs());
});

gulp.task('mocha', function() {
  return gulp.src(mochaTests, {read: false})
      .pipe(mocha());
});

gulp.task('coverage', function(done) {
  gulp.src(source)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function() {
      gulp.src(mochaTests, {read: false})
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        .on('end', done);
    });
});

gulp.task('lint', ['jshint', 'jscs']);
gulp.task('test', ['coverage']);
gulp.task('default', ['lint', 'test']);
