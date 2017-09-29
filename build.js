const gulp = require('gulp')
const bufferify = require('gulp-bufferify').default

gulp.src('src/*.js')
  .pipe(bufferify(content => {
    return `!function(root) {


${content}


if (typeof define == 'function' && (define.cmd || define.amd)) { // amd & cmd
  define(function(require, exports, module) {
    module.exports = IndexDB
  })
}
else if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexDB
}
else {
  root.IndexDB = IndexDB
}


} (
  typeof self !== 'undefined' ? self : // worker
  typeof window !== 'undefined' ? window : // window
  typeof global !== 'undefined' ? global : // node
  this
);`
  }))
  .pipe(gulp.dest('dist'))