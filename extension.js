const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
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
const logfile = 'build.log'
let installPackages = {}
let extensions = []
let excludeNames = ['shared.tsconfig.json', 'build.js', '.DS_Store', 'node_modules', 'package-lock.json', 'package.json']

function runCommand(cmd) {
  try {
    execSync(cmd)
    return true
  } catch (err) {
    const chalk = require('chalk')
    if (err.stdout) {
      console.info(chalk.red(err.stdout.toString()))
    } else {
      console.info(chalk.red(err))
    }
    return false
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
      try{
        fs.mkdirSync(dist);
      } catch (errs) {
        console.error(errs)
      }
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

function getBuildLog() {
  if (fs.existsSync(logfile)) {
    const str = fs.readFileSync(logfile).toString('utf-8')
    return JSON.parse(str)
  }
  fs.writeFileSync(logfile, '{}')
  return {}
}

function shouldUpdate(extension, package, lasttime) {
  let buildHistory = getBuildLog()
  if (!buildHistory[extension]) {
    buildHistory[extension] = lasttime
    fs.writeFileSync(logfile, JSON.stringify(buildHistory))
    console.info('scan', package)
    return true
  }
  if (buildHistory[extension] === lasttime) return false
  buildHistory[extension] = lasttime
  console.info(package, 'will be update')
  fs.writeFileSync(logfile, JSON.stringify(buildHistory))
  return true
}

function parseExtensions() {
  for (let extension of dirs) {
    const extPath = path.join(__dirname, './extensions/' + extension)
    const stat = fs.statSync(extPath)
    if (isExclude(extension) || !stat || stat.isFile()) continue
    const packagePath = path.join(__dirname, './extensions/'  + extension + '/package.json')
    if (!fs.existsSync(packagePath)) {
      const chalk = require('chalk')
      console.info(chalk.yellow(`${packagePath} not exist, is this extension correct?`))
      continue
    }
    const stime = stat.mtime / 1000
    if (shouldUpdate(extension, packagePath, stime)) {
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
    }
    extensions.push(extension)
  }
}

function installDependencies() {
  const package_json_path = path.resolve(__dirname, './extensions/package.json')
  let package_json = {}
  if (fs.existsSync(package_json_path)) package_json = JSON.parse(fs.readFileSync(package_json_path).toString())
  for (let name in installPackages) {
    const filepath = path.resolve(__dirname, './extensions/node_modules/' + name)
    if (fs.existsSync(filepath)) {
      const stat = fs.statSync(filepath)
      if (stat.isFile() || stat.isDirectory()) {
        console.info('file', filepath, 'exist')
        continue
      }
    }
    console.info(`install ${name}@${installPackages[name]}`)
    runCommand('npm install --prefix extensions ' + name + '@' + installPackages[name])
    if (!package_json['dependencies']) package_json['dependencies'] = {}
    package_json['dependencies'][name] = installPackages[name]
  }
  fs.writeFileSync(package_json_path, JSON.stringify(package_json))
}

function ejsInfomations() {}

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
    const ejsfile = 'view.ejs'
    const view = inputDir + '/' + extension + '/' + ejsfile
    const info = ejsInfomations()
    if (fs.existsSync(view)) {
      const content = fs.readFileSync(view)
      const template = ejs.compile(content)
      const html = template(info)
      fs.writeFileSync(inputDir + '/' + extension + '/view.html')
    }
    // process.chdir('extensions/imagedata')
    if (!runCommand(cmd)) {
      const chalk = require('chalk')
      console.info(chalk.red(`build extensions[${extension}] fail: ${cmd}, please clean this directory before retry.`))
      // throw new Error(`build extensions[${extension}] fail: ${cmd}`)
    }
    // process.chdir('../..')
  }
}

function copyModules() {
  const source = path.join(__dirname, './extensions/node_modules')
  if (process.env.NODE_ENV === 'development') {
    const dest = path.join(__dirname, './node_modules')
    copyDir(source, dest, [], console.error)
    const chalk = require('chalk')
    console.info(chalk.yellow(`Develop Mode: copy ${source} to ${dest}`))
  } else {
    const dest = path.join(__dirname, './extensions-dist/node_modules')
    copyDir(source, dest, [], console.error)
    const chalk = require('chalk')
    console.info(chalk.yellow(`copy ${source} to ${dest}`))
  }
}

function copyExtensions() {
  const source = path.join(__dirname, './extensions')
  if (process.env.NODE_ENV === 'development') {
    // const dest = path.join(__dirname, '../node_modules')
    // console.info('develop mode')
    // copyDir(source, dest, [])
  } else {
    const dest = path.join(__dirname, './extensions-dist')
    copyDir(source, dest, excludeNames, console.error)
    const chalk = require('chalk')
    console.info(chalk.yellow(`copy ${source} to ${dest}`))
  }
}

function installInternalExtension() {
  parseExtensions()
  installDependencies()
  buildExtension()
  copyExtensions()
  copyModules()
  const chalk = require('chalk')
  console.info(chalk.yellow('install extensions finish'))
}

module.exports = installInternalExtension
