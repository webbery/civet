const kernel = (function () {
  const instance = require('civetkern')
  let flag = 0
  if (process.argv[process.argv.length - 1] === 'renderer') {
    flag = 1
  }
  const CivetConfig = require('../public/CivetConfig').CivetConfig
  const cfg = new CivetConfig()
  const config = cfg.getConfig()
  if (!instance.civetkern.init(config, flag)) {
    console.info('init fail')
  }
  console.info(config, flag)
  return instance.civetkern
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
  getFilesSnap: (flag) => {
    return kernel.getFilesSnap(flag)
  },
  getFilesInfo: (filesID) => { return kernel.getFilesInfo(filesID) },
  getUnTagFiles: () => { return kernel.getUnTagFiles() },
  getUnClassifyFiles: () => { return kernel.getUnClassifyFiles() },
  getAllClasses: () => { return kernel.getAllClasses() },
  findFiles: (condition) => { return kernel.findFiles(condition) },
  // 以下接口为可写接口
  generateFilesID: (num) => { return kernel.generateFilesID(num) },
  addFiles: (src) => { return kernel.addFiles(src) },
  removeFiles: (filesID) => { kernel.removeFiles(filesID) },
  updateFilesKeywords: (filesID, keywords) => {},
  setTags: (filesID, tags) => { return kernel.setTags(filesID, tags) },
  removeTags: (filesID, tags) => { return kernel.removeTags(filesID, tags) },
  addClasses: (classes) => {},
  release: () => {
    kernel.release()
  }
}
