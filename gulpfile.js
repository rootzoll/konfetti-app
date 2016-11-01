var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var connect = require('gulp-connect');

var fs = require('fs');
var path = require('path');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

/*
var sass = require('gulp-sass');
gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});
*/

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(['./www/*.html'], ['html']);
  gulp.watch(['./www/*.js'], ['js']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('connect', function() {
  connect.server({
    root: 'www',
    livereload: true,
    port: 3000
  });
});

gulp.task('git-version', function() {
     console.log(
      'UPDATING GIT VERSION TO --> buildversion.js'
    ); 
    var exec = require('child_process').exec;
    exec('git describe', function(error, stdout, stderr) {
    try {
      var version = "n/a";
      if ((typeof stdout != "undefined") && (stdout!=null) && (stdout.length>0)) version = stdout.trim();
      var fileContent = "window.appGitVersion='"+version+"';";
      var jsPath = path.join('www', 'buildversion.js');
      fs.unlinkSync(jsPath);
      fs.writeFileSync(jsPath, fileContent, 'utf8');
      console.log("OK file '"+jsPath+"' updated\n");
    } catch (e) {
      console.log("BEFORE BUILD HOOK --> ERROR ON GETTING GIT VERSION : "+JSON.stringify(e)+" \n");
    }
});

});