console.info("┏ Compiling wasm bindings======================================================")

const iconv = require('iconv-lite');
var process = require('child_process');
const path = require('path')
const fs = require('fs')

const COMPILER = 'em++';
const OPTIMIZE="-Os"
const LDFLAGS="${OPTIMIZE}"
const CFLAGS="${OPTIMIZE}"
const CXXFLAGS="${OPTIMIZE}"
const OBJS = "caxios.js"

const SRC_ROOT_DIR = "./caxios/"
const DIST = "./src/generated/"

let SRC = ""

function recursiveCPP(root) {
  const dir = fs.readdirSync(root)
  for (let filename of dir) {
    const fullpath = path.join(root, filename)
    const stat = fs.statSync(fullpath)
    if (stat.isDirectory()) {
      recursiveCPP(fullpath)
    }
    else if (stat.isFile()) {
      if (fullpath.indexOf('.cpp') > 0) {
        SRC += fullpath + ' '
      }
    }
  }
}

recursiveCPP(SRC_ROOT_DIR);

const cmd = COMPILER + ' ' + OPTIMIZE + ' ' + 
            '--bind' + ' ' + 
            '-s STRICT=1' + ' ' + 
            '-s ALLOW_MEMORY_GROWTH=1' + ' ' +
            '-s MALLOC=emmalloc' + ' ' + 
            '-s FILESYSTEM=1' + ' ' + 
            '-s EXPORT_ES6=1' + ' ' + 
            '-s MODULARIZE=1' + ' ' + 
            '-s USE_ES6_IMPORT_META=0' + ' ' + 
            '-s USE_BOOST_HEADERS=1' + ' ' + 
            '-s WASM=1' + ' ' + 
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
  console.info("┗ =============================================================================")
});