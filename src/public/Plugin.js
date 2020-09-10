
let thirdModules = {}

function loadModule(moduleName, fullpath) {
  try{
    thirdModules[moduleName] = require(fullpath)
  } catch (err) {
    console.error(err)
  }
}
