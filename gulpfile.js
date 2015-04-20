var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha');

var source = ['lib/**/*.js'];
var mochaTests = [
  'test/**/*.js',
  '!test/client/**/*.js',
  '!test/fixtures/**/*.js'
];

gulp.task('eslint', function() {
  return gulp.src(Array.prototype.concat(source, mochaTests))
    .pipe(eslint())
    .pipe(eslint.format('stylish'))
    .pipe(eslint.failAfterError());
});

gulp.task('mocha', ['lint'], function() {
  return gulp.src(mochaTests, {read: false})
      .pipe(mocha());
});

gulp.task('coverage', ['lint'], function(done) {
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

gulp.task('lint', ['eslint']);
gulp.task('test', ['coverage']);
gulp.task('default', ['lint', 'test']);
