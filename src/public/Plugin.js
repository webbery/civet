/*
Plugin describe:
plugin = module[plugin_name]
plugin.type: three of `loader`, `extracter` or `searcher`
if it is `loader`, it will be used when file matched is load.

type
  |-- loader
        |-- filetype: jpg, bmp...
        |-- ext: jpg, jpeg, ...
        |-- init()
        |-- release()
        |-- draw()
        |-- render()
        |-- preview()
        |-- attach(): custom your operation to add infomation to this file
        |-- meta: {name: xxx, author: xxx, ...}
        |-- extracter:
        |-- searcher:
  |-- extracter
  |-- searcher
help

*/
const path = require('path')
const fs = require('fs')

const thirdModules = (function(plgDir) {
  let modules = {}

  function loadModule(moduleName, fullpath) {
    try {
      modules[moduleName] = require(fullpath)
      console.info('load plugin: ', moduleName)
    } catch (err) {
      console.error(err)
    }
  }

  const plguins = fs.readdirSync(plgDir)
  for (let filename of plguins) {
    const fullpath = path.join(plgDir, filename)
    const stat = fs.statSync(fullpath)
    if (!stat.isDirectory()) {
      if (path.exist(fullpath + '/index.js')) {
        loadModule(filename, fullpath + '/index.js')
      }
    }
    return modules
  }
})('plugins')

export default {
  modules: thirdModules
}
