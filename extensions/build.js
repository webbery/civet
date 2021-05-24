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
function runCommand(cmd) {
  // console.info(process.cwd(), __dirname)
  try {
    execSync(cmd)
    // console.info(child.toLocaleString())
  } catch( err ) {
    console.info(err)
  }
}

let installPackages = {}
let extensions = []
for (let extension of dirs) {
  if (extension === 'build.js' || extension === '.DS_Store' || extension === 'node_modules') continue
  const pack = fs.readFileSync('./extensions/' + extension + '/package.json', 'utf-8')
  const jsn = JSON.parse(pack)
  for (let name in jsn['dependencies']) {
    try {
      let child = execSync(`npm ls ${name}`)
      console.info(child.toString())
      if (child.toString() === 'false') {
        installPackages[name] = jsn['dependencies'][name]
      }
    } catch( err ) {
      installPackages[name] = jsn['dependencies'][name]
    }
  }
  extensions.push(extension)
}

function installDependencies() {
  for (let name in installPackages) {
    console.info(`install ${name}@${installPackages[name]}`)
    runCommand('npm install --prefix extensions ' + name + '@' + installPackages[name])
  }
}

function buildExtension() {
  for (let extension of extensions) {
    let inputFiles = inputDir + '/' + extension + '/index.ts';
    const cmd = compiler + ' "' + inputFiles +'" --outDir "' + outputDir + '/' + extension + '"'
    // process.chdir('extensions/imagedata')
    // runCommand('node_modules\\.bin\\tsc extensions/imagedata/index.ts')
    // runCommand('"node_modules/.bin/tsc" index.ts')
    console.info('build extensions', extension)
    runCommand(cmd)
    // process.chdir('../..')
  }
}

function copyModules() {
  const os = require('os')
  const platform = os.platform()
  if (process.env.NODE_ENV !== 'production') {
    console.info('develop mode')
    if (platform === 'win32') {
      execSync('xcopy ' + '.\\extensions\\node_modules' + ' ' + '.\\node_modules\\ /s /e /y')
    } else {
      execSync('cp -r ' + path.join(__dirname, '../extensions/node_modules') + ' ' +path.join(__dirname, '../node_modules'))
    }
  } else {
    if (platform === 'win32') {
      execSync('xcopy ' + '.\\extensions' + ' ' + '.\\extensions-dist /s /e /y')
    } else {
      execSync('cp -r ' + path.join(__dirname, '../extensions') + ' ' +path.join(__dirname, '../extensions-dist'))
    }
  }
}

function copyExtensions() {}


installDependencies()
buildExtension()
copyModules()
copyExtensions()
