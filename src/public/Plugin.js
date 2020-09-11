const path = require('path')
const fs = require('fs')

const thirdModules = (function(){
  let modules = {}

  function loadModule(moduleName, fullpath) {
    try{
        modules[moduleName] = require(fullpath)
    } catch (err) {
      console.error(err)
    }
  }

  const plguins = fs.readdirSync(plgDir)
  for (let filename of plguins) {
    const fullpath = path.join(plgDir, filename)
    const stat = fs.statSync(fullpath)
    if (!stat.isDirectory()) {
      loadModule(filename, fullpath + '/entry.js')
    }
    return modules
  }
})()

export default {
  modules: thirdModules
}
