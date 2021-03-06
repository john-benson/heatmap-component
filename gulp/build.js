'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var runSequence = require('run-sequence');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('zip', function () {
  return gulp.src([
      path.join(conf.paths.dist, '**/*.png'),
      path.join(conf.paths.dist, '**/*.js'),
      path.join(conf.paths.dist, '**/*.css')
    ])
    .pipe($.zip('dist.zip'))
    .pipe(gulp.dest(conf.paths.dist))
});

gulp.task('partials', function () {
  return gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
    path.join(conf.paths.tmp, '/serve/app/**/*.html')
  ])
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'heatmapComponent',
      root: 'app'
    }))
    .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials'], function () {
  var partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: path.join(conf.paths.tmp, '/partials'),
    addRootSlash: false
  };

  var htmlFilter = $.filter('*.html');
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');
  var assets;

  var revReplaceOptions = {
    modifyReved: function (filename) {

      if(conf.salesforce.resourceFolder) {
        filename = '{!URLFOR($Resource.' + conf.salesforce.resourceFolder + ',\'' + filename + '\')}';
      }

      return filename;
    }
  };

  return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace(revReplaceOptions))
    .pipe(htmlFilter)
    .pipe(htmlFilter.restore())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', function () {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
});

gulp.task('other', function () {
  var fileFilter = $.filter(function (file) {
    return file.stat.isFile();
  });

  return gulp.src([
    path.join(conf.paths.src, '/**/*'),
    path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss}')
  ])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('clean', function (done) {
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')], done);
});

gulp.task('build:sf:config', function () {
  conf.paths.dist = 'dist-sf'
  conf.salesforce.resourceFolder = 'heatmapDist';
});

gulp.task('appendApexPage', function () {
  return gulp.src(path.join(conf.paths.dist, 'index.html'))
    .pipe($.insert.wrap('<apex:page>', '</apex:page>'))
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('closeLinks', function () {

  return gulp.src(path.join(conf.paths.dist, 'index.html'))
    .pipe($.replaceTask({
      patterns: [
        {
          match: '.css\'\)}\">',
          replacement: '.css\')}"/>'
        },
        {
          match: '<head>',
          replacement: '<head><base href="{!URLFOR($Resource.' + conf.salesforce.resourceFolder + ', \'/\')}" />'
        }
      ],
      usePrefix: false
    }))
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
})

gulp.task('build', ['html', 'fonts', 'other']);

gulp.task('build:sf', function () {
  runSequence('build:sf:config', 'clean', 'build', 'zip', 'appendApexPage', 'closeLinks');
});
