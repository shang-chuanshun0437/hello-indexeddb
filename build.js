var gulp = require('gulp')
var bufferify = require('gulp-bufferify').default
var babel = require('gulp-babel')

var namespace = 'HelloIndexedDB'
var entryfile = 'src/hello-indexeddb.js'

gulp.src(entryfile)
  .pipe(babel())
  .pipe(bufferify(function(content) {

    content = content.replace(/self\.indexedDB/g, 'root.indexedDB')
    content = content.replace(/Object\.defineProperty\(exports,[\s\S]+?\);/gm, '')
    content = content.replace(`exports.default = HelloIndexedDB;`, '')
    content = `
;(function(root) {

${content}

if (typeof define === 'function' && (define.cmd || define.amd)) { // amd | cmd
  define(function(require, exports, module) {
    module.exports = HelloIndexedDB;
  });
}
else if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelloIndexedDB;
}
else {
  root['hello-indexeddb'] = HelloIndexedDB;
}

})(typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : this);
    `
    content = content.trim()
    content += "\n"

    return content
  }))
  .pipe(gulp.dest('dist'))