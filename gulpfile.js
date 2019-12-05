'use strict';

/* REQUERIMENTS */

const gulp = require('gulp');
const cp = require('child_process');
const shell = require('gulp-shell')
const gutil = require('gulp-util');

var browserSync = require('browser-sync').create();
var autoprefixer = require('gulp-autoprefixer');
var cache = require('gulp-cache');
var htmlmin = require('gulp-htmlmin');
var minifyInline = require('gulp-minify-inline');
var imagemin = require('gulp-imagemin');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');


/* CONFIG */

var dev = {
	base: ".",
	html : "./**/*.html",
	css : "./css/*.?(s)css",
	sass : "./_sass/**/*.scss",
	js : "./js/**/*.js",
	img : "./img/**/*",
};

var build = {
	img : "_site/img/**/*.?(jpg|png|svg)",
}

var dest = {
	base: "_site",
	css : "css",
	js : "_site/js",
	img : "_site/img",
}

/* DESARROLLO */

var messages = {
	jekyllDev: '<span style="color: grey">Running:</span> $ jekyll build for dev',
	jekyllProd: '<span style="color: grey">Running:</span> $ jekyll build for prod'
};


// Build Jekyll en dev

gulp.task('jekyll-dev', function (done) {
	browserSync.notify(messages.jekyllDev);
	return gulp
    .src("index.html", { read: false })
    .pipe(
		shell([
		
			//	Variables de desarrollo:
			//	http://blog.benoitvallon.com/tips/add-a-development-_config-yml-file-to-your-jekyll-blog/
			//	http://sandeepbhardwaj.github.io/2015/10/17/jekyll-with-environment-variable-and-multiple-config-files.html	  
			"bundle exec jekyll build --drafts --config _config.yml,_config.dev.yml"
	])
    )
    .on("error", gutil.log);
});

// Rebuild Jekyll & reload

gulp.task('jekyll-rebuild', ['jekyll-dev'], function () {
	browserSync.reload({
		stream:true
	})
});

// Browsrsync + jelyll load

gulp.task('browser-sync', ['jekyll-dev'], function() {
	browserSync.init({
		server: {
			baseDir: '_site'
		},
        files: '_site/**', // watch the build directory for changes
        port: 4000 // optional, set it for a specific port
    })
});

// Tarea watch

 gulp.task('watch', function () {
 	gulp.watch([dev.sass], ['sass','jekyll-rebuild']);
 	gulp.watch([dev.js], ['sass','jekyll-rebuild']);
 	gulp.watch(['./gulpfile.js'], ['sass','jekyll-rebuild']);
 	gulp.watch(['index.html', '_layouts/**/*.html', '_posts/*', '_includes/**/*.html', './pages/*'], ['sass','jekyll-rebuild']);
 });

// Procesamos los estilos
gulp.task('sass', function(){
	return gulp.src([dev.sass])
	.pipe(sass({
		onError: browserSync.notify
	}))
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false
	}))
  	.pipe(browserSync.reload({stream:true}))
  	.pipe(gulp.dest('css'));
  	// copiamos a /css para que jekyll lo copie a prod.
  	// En este proceso Jekyll no toca sass
	// https://github.com/jekyll/jekyll-sass-converter/tree/master/example
});

/* PRODUCCIÓN */

gulp.task('jekyll-prod', function (done) {
  browserSync.notify(messages.jekyllProd);
  return gulp
    .src("index.html", { read: false })
    .pipe(
		shell([
			"bundle exec jekyll build"
	])
    )
    .on("error", gutil.log);
});

gulp.task('sass-prod', function () {
return gulp.src([dev.sass])
	.pipe(sass({
		onError: browserSync.notify
	}))
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false
	}))
	.pipe(cssnano())
	.pipe(gulp.dest('css'));
	// copiamos a /css para que jekyll lo copie a prod.
	// En este proceso Jekyll no toca sass
	// https://github.com/jekyll/jekyll-sass-converter/tree/master/example
});

// Scripts

gulp.task('js-prod', function() {
  return gulp.src(['_site/js/*.js'])
  .pipe(concat('main.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_site/js'))
});


// Minificar HTML para prod

gulp.task('html-prod', function() {
	return gulp.src('_site/**/*.html')
	.pipe(htmlmin({collapseWhitespace: true}))
	// .pipe(minifyInline())
	.pipe(gulp.dest('_site/./'));
});

// Optimización de imagenes

gulp.task('img-prod', function(){
	gulp.src(build.img)
	.pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
	.pipe(gulp.dest(dest.img));
});


/* TAREAS PRINCIPALES */

/**
 * Default. Entorno desarrollo: Procesa sass y arranca browser-sync,
 * que a su vez arranca un jekyll build. Tarea de watch integrada
 */

 gulp.task('default', ['sass','browser-sync','watch']);

/* PRODCUCCIÓN */

gulp.task('build', function() {
 	runSequence(['sass-prod','jekyll-prod'],'html-prod','js-prod','img-prod');
});


