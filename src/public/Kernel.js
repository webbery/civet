const kernel = (function () {
  const instance = require('civetkern')
  let flag = 0
  if (process.argv[process.argv.length - 1] === 'renderer') {
    flag = 1
  }
  let _isInit = false
  function _init() {
    const CivetConfig = require('../public/CivetConfig').CivetConfig
    const cfg = new CivetConfig()
    const config = cfg.getConfig()
    if (config.resources.length === 0) return false
    try {
      if (!instance.civetkern.init(config, flag)) {
        console.info('init fail')
        return false
      }
      _isInit = true
      console.info(config, flag)
      return true
    } catch (exception) {
      console.info('init civetkern exception:', exception)
    }
  }
  return function() {
    if (!_isInit) {
      if (!_init()) return null
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
  init: () => {
    kernel()
  },
  getFilesSnap: (flag) => {
    return kernel().getFilesSnap(flag)
  },
  getFilesInfo: (filesID) => { return kernel().getFilesInfo(filesID) },
  getUnTagFiles: () => { return kernel().getUnTagFiles() },
  getUnClassifyFiles: () => { return kernel().getUnClassifyFiles() },
  getAllClasses: () => { return kernel().getAllClasses() },
  getAllTags: () => { return kernel().getAllTags() },
  findFiles: (condition) => { return kernel().findFiles(condition) },
  writeLog: (str) => { kernel.writeLog(str) },
  // 以下接口为可写接口
  generateFilesID: (num) => { return kernel().generateFilesID(num) },
  addFiles: (src) => { return kernel().addFiles(src) },
  removeFiles: (filesID) => { kernel().removeFiles(filesID) },
  updateFilesKeywords: (filesID, keywords) => {},
  setTags: (filesID, tags) => { return kernel().setTags({id: filesID, tag: tags}) },
  removeTags: (filesID, tags) => { return kernel().removeTags({id: filesID, tag: tags}) },
  addClasses: (sql) => { return kernel().addClasses(sql) },
  undateFile: (sql) => { return kernel().updateFile(sql) },
  undateClassName: (classPath, newPath) => { return kernel().undateClassName(classPath, newPath) },
  release: () => {
    kernel().release()
  }
}
