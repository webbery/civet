console.info("┏ Compiling wasm bindings======================================================")

const iconv = require('iconv-lite');
var process = require('child_process');
const path = require('path')
const fs = require('fs')
const tmp = require('tmp');
const expect = require('chai').expect;

const OPTIMIZE="-Os"
const LDFLAGS="${OPTIMIZE}"
const CFLAGS='--bind' + ' ' + 
              '-s STRICT=1' + ' ' + 
              '-s ALLOW_MEMORY_GROWTH=1' + ' ' +
              '-s MALLOC=emmalloc' + ' ' + 
              '-s FILESYSTEM=1' + ' ' + 
              '-s MODULARIZE=1' + ' ' + 
              '--no-entry' + ' '

const CXXFLAGS = CFLAGS + 
              '-s USE_BOOST_HEADERS=1' + ' ' +
              '-s EXPORT_ES6=1' + ' ' + 
              '-s USE_ES6_IMPORT_META=0' + ' ' + 
              '-s WASM=1' + ' ' + 
              '-L./caxios -llmdb' + ' '

const COMPILER = {'.cpp': 'em++', '.c':'emcc'};
const COMPILER_FLAGS = {'.cpp': CXXFLAGS, '.c': CFLAGS};
const OBJS = "caxios.js"

const SRC_ROOT_DIR = "./caxios/"
const DIST = "./src/generated/"


function recursiveCPP(root, filetype, source) {
  const dir = fs.readdirSync(root)
  for (let filename of dir) {
    const fullpath = path.join(root, filename)
    const stat = fs.statSync(fullpath)
    if (stat.isDirectory()) {
      recursiveCPP(fullpath)
    }
    else if (stat.isFile()) {
      if (fullpath.indexOf(filetype) > 0) {
        source += fullpath + ' '
      }
    }
  }
  return source
}

class Scriptable {
  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
  }
 
  runCommand(hookScript) {
    return () => {
      console.log(`${hookScript}`);
      return process.execSync(hookScript, {stdio: [this.stdin, this.stdout, this.stderr], encoding: 'buffer'});
    }
  }
}

function compile(filetype, lib) {
  let src_files = ""
  if (lib !== undefined)
    src_files = recursiveCPP(SRC_ROOT_DIR+lib, filetype, src_files);
  else
    src_files = recursiveCPP(SRC_ROOT_DIR, filetype, src_files);

  let lib_file = DIST + OBJS
  if (lib !== undefined) {
    lib_file = './caxios/lib' + lib + '.a'
  }

  const cmd = COMPILER[filetype] + ' ' + OPTIMIZE + ' ' + COMPILER_FLAGS[filetype] + 
              '-o ' + lib_file + ' ' + 
              src_files
  try{
    // var scriptable = new Scriptable();
    // scriptable.stdout = tmp.fileSync({prefix: 'stdout-'});
    // scriptable.stderr = tmp.fileSync({prefix: 'stderr-'});
    // const result=scriptable.runCommand(cmd)();
    console.log(`${cmd}`);
    const result = process.execSync(cmd, {stdio: 'inherit'})
    if (result.length > 0) {
      // output = iconv.decode(result, 'cp936');
      console.log(output);
    }
    // console.info(scriptable.stdout.name, scriptable.stderr.name)
    // expect(fs.readFileSync(scriptable.stdout.name, {encoding: 'utf-8'})).string(cmd);
    // expect(fs.readFileSync(scriptable.stderr.name, {encoding: 'utf-8'})).equal('');
  }catch(error) {
    if (error && error.length > 0) {
      console.info('ERR')
      output = iconv.decode(error, 'cp936');
      console.log(output);
    }
  }
}

compile('.c', 'lmdb')
console.info('\n')
compile('.cpp')

console.info("┗ =============================================================================")
