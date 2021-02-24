/*
Plugin describe:
plugin = module[plugin_name]
plugin.type: three of `loader`, `extracter` or `searcher`
if it is `loader`, it will be used when file matched is load.

type
  |-- file
        |-- name: jpg, bmp...
        |-- ext: jpg, jpeg, ...
        |-- init()
        |-- load(src)
        |-- release()
        |-- draw()
        |-- render()
        |-- preview()
        |-- attach(): custom your operation to add infomation to this file
        |-- meta: {name: xxx, author: xxx, ...}
        |-- extracter:
        |-- searcher:
  |-- extract
  |-- search
help

*/
// const path = require('path')
// const fs = require('fs')

let thirdModules = null
function init(plgDir) {
  // const modules = {}

  // function loadModule(moduleName, fullpath) {
  //   try {
  //     modules[moduleName] = require(fullpath)
  //     console.info('load plugin: ', moduleName)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  // const plguins = fs.readdirSync(plgDir)
  // for (const filename of plguins) {
  //   const fullpath = path.join(plgDir, filename)
  //   const stat = fs.statSync(fullpath)
  //   if (!stat.isDirectory()) {
  //     if (path.exist(fullpath + '/index.js')) {
  //       loadModule(filename, fullpath + '/index.js')
  //     }
  //   }
  //   return modules
  // }
}

function load() {
  if (thirdModules === null) {
    const app = require('electron')
    const root = app.getAppPath()
    console.info('plugin dir:', root)
    thirdModules = init(root + 'plugins')
  }
  return thirdModules
}
export default {
  load: load,
  getModuleByExt: (ext) => {
    load()
    for (const module of thirdModules) {
      if (module.type === 'file' && module.ext.indexOf(ext) > -1) {
        return module
      }
    }
    return null
  }
}
