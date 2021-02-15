// const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function init(plgDir) {
  let modules = {}

  function loadModule() {
    try {
      const extensionPath = installPath()
      const extensions = fs.readdirSync(extensionPath)
      for (let extensionID of extensions) {
        if (modules.hasOwnProperty(extensionID)) continue
        const fullpath = path.join(extensionPath, extensionID)
        const pkg = fullpath + '/package.json'
        const config = require(pkg)
        modules[extensionID] = config
      }
    } catch (err) {
      console.error(err)
    }
  }

  loadModule()
  return modules
}

function load() {
  return init()
}

function unzip(filepath) {}

function installPath() {
  const os = require('os')
  const platform = os.platform()
  const app = require('./System').default.app()
  const userDir = app.getPath('userData')
  switch (platform) {
    case 'win32':
      break
    case 'mac':
      break
    default:
      break
  }
  const extensionPath = userDir + '/.civet/extension'
  if (!fs.accessSync(extensionPath, fs.constants.F_OK)) {
    fs.mkdirSync(extensionPath)
  }
  console.info('extension path:', extensionPath)
  return extensionPath
}

function install(extension) {
  //
  const instPath = installPath()
  console.info(instPath)
}
export default {
  unzip: unzip,
  install: install,
  uninstall: null,
  load: load,
  getModuleByExt: (ext) => {
    load()
    // for (let module of thirdModules) {
    //   if (module['type'] === 'file' && module['ext'].indexOf(ext) > -1) {
    //     return module
    //   }
    // }
    const lext = ext.toLowerCase()
    console.info(lext)
    if (lext === 'jpg' || lext === 'jpeg' || lext === 'bmp' || lext === 'tiff' || lext === 'png') return true
    return null
  }
}
