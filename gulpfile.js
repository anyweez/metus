var gulp = require('gulp');
var jade = require('gulp-jade');
var concat = require('gulp-concat'); // join a group of files (gulp.dest) into a single file
var sass = require('gulp-sass');
var merge = require('merge2');
var debug = require('gulp-debug');
var browserify = require('gulp-browserify');
var mocha = require('gulp-mocha');

gulp.task('default', ['templates', 'styles', 'js']);

/**
 * Build all Jade templates and condense down into a single index.html since this
 * is a single-page app.
 */
gulp.task('templates', function () {
    return gulp.src('./src/jade/*.jade')
        .pipe(jade({}))
        .pipe(concat('index.html'))
        .pipe(gulp.dest('./'));
});

gulp.task('styles', function () {
    // Read in some standard CSS and merge it with compiled SCSS, then output to a
    // single CSS file (css/style.css).
    return merge(
            // Read in standard CSS files (normalize.css, HTML5Boilerplate)
            gulp.src('./src/styles/css/*.css'),
            // Read in this project's sass files and compile them   
            gulp.src('./src/styles/scss/*.scss').pipe(sass().on('error', sass.logError))
        )
        .pipe(debug({
            title: ':'
        }))
        // Concat into a single CSS file and output
        .pipe(concat('style.css'))
        .pipe(gulp.dest('./css'));
});

gulp.task('js', ['test'], function () {
    return gulp.src('src/js/metus.js')
        .pipe(browserify({}))
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./js'));
});

gulp.task('test', function () {
    return gulp.src('test/*.js', {
            read: false
        })
        .pipe(mocha());
});

gulp.task('watch', ['js', 'templates', 'styles'], function () {
    gulp.watch('./src/jade/*.jade', ['templates']);
    gulp.watch('./src/styles/scss/*.scss', ['styles']);
    gulp.watch('./src/js/*.js', ['js']);
});