const fs = require('fs')
const path = require('path')
const dirs = fs.readdirSync('./extensions')
const { execSync } = require('child_process');
let compiler = 'node_modules/.bin/tsc'
const os = require('os')
const platform = os.platform()
if (platform === 'win32') {
  compiler = 'node_modules\\.bin\\tsc'
}
const options = ''
const inputDir = 'extensions'
const outputDir = 'extensions'
let installPackages = {}
let extensions = []
let excludeNames = ['shared.tsconfig.json', 'build.js', '.DS_Store', 'node_modules', 'package-lock.json', 'package.json']

function runCommand(cmd) {
  // console.info(process.cwd(), __dirname)
  try {
    execSync(cmd)
    // console.info(child.toLocaleString())
  } catch (err) {
    console.info(err)
  }
}

function isInArray(name, arr) {
  for (let n of arr) {
    if (n === name) return true
  }
  return false;
}
function copyDir(src, dist, excludes, callback) {
  fs.access(dist, function(err){
    if(err){
      // 目录不存在时创建目录
      fs.mkdirSync(dist);
    }
    _copy(null, src, dist);
  });

  function _copy(err, src, dist) {
    if(err){
      callback(err);
    } else {
      if (isInArray(src, excludes)) {
        console.info(src, ' no need to copy')
        return;
      }
      fs.readdir(src, function(err, paths) {
        if(err){
          callback(err)
        } else {
          paths.forEach(function(path) {
            var _src = src + '/' +path;
            var _dist = dist + '/' +path;
            fs.stat(_src, function(err, stat) {
              if(err){
                callback(err);
              } else {
                // 判断是文件还是目录
                if(stat.isFile()) {
                  fs.writeFileSync(_dist, fs.readFileSync(_src));
                } else if(stat.isDirectory()) {
                  // 当是目录是，递归复制
                  copyDir(_src, _dist, excludes, callback)
                }
              }
            })
          })
        }
      })
    }
  }
}

function isExclude(extension) {
  for (let name of excludeNames) {
    if (name === extension) return true
  }
  return false
}

function parseExtensions() {
  for (let extension of dirs) {
    const extPath = path.join(__dirname, '../extensions/' + extension)
    console.info('extpath', extPath)
    const stat = fs.statSync(extPath)
    if (isExclude(extension) || !stat || stat.isFile()) continue
    const packagePath = path.join(__dirname, '../extensions/'  + extension + '/package.json')
    const pack = fs.readFileSync(packagePath, 'utf-8')
    const jsn = JSON.parse(pack)
    for (let name in jsn['dependencies']) {
      try {
        let child = execSync(`npm ls ${name}`)
        // console.info(child.toString())
        if (child.toString() === 'false') {
          installPackages[name] = jsn['dependencies'][name]
        }
      } catch (err) {
        installPackages[name] = jsn['dependencies'][name]
      }
    }
    extensions.push(extension)
  }
}

function installDependencies() {
  for (let name in installPackages) {
    console.info(`install ${name}@${installPackages[name]}`)
    runCommand('npm install --prefix extensions ' + name + '@' + installPackages[name])
  }
}

function buildExtension() {
  for (let extension of extensions) {
    // copyCivet(extension)
    let files = ['index.ts', '../../src/civet.d.ts']
    let inputFiles = ''
    for (let file of files) {
      inputFiles += '"' + inputDir + '/' + extension + '/' + file + '"';
      inputFiles += ' '
    }
    const cmd = compiler + ' ' + inputFiles + ' --outDir "' + outputDir + '/' + extension + '"'
    // process.chdir('extensions/imagedata')
    // runCommand('node_modules\\.bin\\tsc extensions/imagedata/index.ts')
    // runCommand('"node_modules/.bin/tsc" index.ts')
    console.info('build extensions', extension)
    runCommand(cmd)
    // process.chdir('../..')
  }
}

function copyModules() {
  const source = path.join(__dirname, '../extensions/node_modules')
  if (process.env.NODE_ENV === 'development') {
    const dest = path.join(__dirname, '../node_modules')
    console.info('develop mode')
    copyDir(source, dest, [], console.error)
  } else {
    const dest = path.join(__dirname, '../extensions-dist/node_modules')
    copyDir(source, dest, [], console.error)
  }
}

function copyExtensions() {
  const source = path.join(__dirname, '../extensions')
  if (process.env.NODE_ENV === 'development') {
    // const dest = path.join(__dirname, '../node_modules')
    // console.info('develop mode')
    // copyDir(source, dest, [])
  } else {
    const dest = path.join(__dirname, '../extensions-dist')
    copyDir(source, dest, excludeNames, console.error)
  }
}

function installInternalExtension() {
  parseExtensions()
  installDependencies()
  buildExtension()
  copyExtensions()
  copyModules()
  console.info('install extensions finish')
}

module.exports = installInternalExtension
