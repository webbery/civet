const kernel = (function () {
  const instance = require('civetkern')
  let flag = 0
  if (process.argv[process.argv.length - 1] === 'renderer') {
    flag = 1
  }
  let _isInit = false
  function _init(name) {
    const cfg = require('./CivetConfig').config
    const config = cfg.getConfig(true)
    if (config.resources.length === 0) return false
    try {
      if (!instance.civetkern.init(config, flag, true)) {
        console.info('init fail')
        return false
      }
      // if (!cfg.isDBExist(name)) {
      //   console.info('db not exist')
      //   return false
      // }
      _isInit = true
      console.info(config, flag, instance.civetkern)
      return true
    } catch (exception) {
      console.info('init civetkern exception:', exception)
    }
  }
  return function(name) {
    if (!_isInit) {
      if (!_init(name)) return null
    }
    return instance.civetkern
  }
})()

function zipFile(input) {
  const fs = require('fs')
  const inputStream = fs.createReadStream(input)
  const zlib = require('zlib')
  const gz = zlib.createGzip()
  const stream = require('stream')
  stream.pipeline(inputStream, gz, fs.createWriteStream(input + '.gz'), (err) => {
    if (err) {
      console.info('zlib error:', err)
    }
  })
}

global.zipFile = zipFile

export default {
  init: (name) => {
    kernel(name)
  },
  getFilesSnap: (flag) => {
    return kernel().getFilesSnap(flag)
  },
  getFilesInfo: (filesID) => { return kernel().getFilesInfo(filesID) },
  getUnTagFiles: () => { return kernel().getUnTagFiles() },
  getUnClassifyFiles: () => { return kernel().getUnClassifyFiles() },
  getClasses: (parent) => { return kernel().getClasses(parent) },
  getClassDetail: (category) => { return kernel().getClassesInfo(category) },
  getAllTags: () => { return kernel().getAllTags() },
  query: (condition) => { return kernel().query(condition) },
  writeLog: (str) => { kernel.writeLog(str) },
  // 以下接口为可写接口
  generateFilesID: (num) => { return kernel().generateFilesID(num) },
  addFiles: (src) => { return kernel().addFiles(src) },
  addMeta: (filesID, meta) => { return kernel().addMeta({id: filesID, meta: meta}) },
  removeFiles: (filesID) => { kernel().removeFiles(filesID) },
  setTags: (filesID, tags) => { return kernel().setTags({ id: filesID, tag: tags }) },
  removeTags: (filesID, tags) => { return kernel().removeTags({ id: filesID, tag: tags }) },
  addClasses: (sql) => { return kernel().addClasses(sql) },
  removeClasses: (classes) => { return kernel().removeClasses(classes) },
  updateFile: (sql) => { return kernel().updateFile(sql) },
  updateClassName: (classPath, newPath) => { return kernel().updateClassName(classPath, newPath) },
  release: () => {
    kernel().release()
  }
}
