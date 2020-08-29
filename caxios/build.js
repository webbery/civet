console.info("┏ Compiling wasm bindings==================")

const iconv = require('iconv-lite');
var process = require('child_process');

const COMPILER = 'em++';
const OPTIMIZE="-Os"
const LDFLAGS="${OPTIMIZE}"
const CFLAGS="${OPTIMIZE}"
const CXXFLAGS="${OPTIMIZE}"
const OBJS = "caxios.js"

const SRC = "./caxios/caxios.cpp"
const DIST = "./src/generated/"

const cmd = COMPILER + ' ' + OPTIMIZE + ' ' + 
            '--bind' + ' ' + 
            '-s STRICT=1' + ' ' + 
            '-s ALLOW_MEMORY_GROWTH=1' + ' ' +
            '-s MALLOC=emmalloc' + ' ' + 
            '-s FILESYSTEM=1' + ' ' + 
            '-s EXPORT_ES6=1' + ' ' + 
            '-s MODULARIZE=1' + ' ' + 
            '-s USE_ES6_IMPORT_META=0' + ' ' + 
            '--no-entry' + ' ' + 
            '-o ' + DIST + OBJS + ' ' + SRC

process.exec(cmd, { encoding: 'buffer' }, function(error, stdout, stderr) {
  if (error && error.length > 0) {
    output = iconv.decode(error, 'cp936');
    console.log(output);
  }
  else if (stderr.length > 0) {
    output = iconv.decode(stderr, 'cp936');
    console.log(output);
  }
  else {
    output = iconv.decode(stdout, 'cp936');
    console.log(output);
  }
  console.info("┗ =========================================")
});