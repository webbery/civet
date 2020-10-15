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

export default {
  getFilesSnap: (flag) => {
    console.info('getFilesSnap')
    return kernel.getFilesSnap(flag)
  },
  getFilesInfo: (filesID) => { return kernel.getFilesInfo(filesID) },
  findFiles: (condition) => { return kernel.findFiles(condition) },
  // 以下接口为可写接口
  generateFilesID: (num) => { return kernel.generateFilesID(num) },
  addFiles: (src) => { return kernel.addFiles(src) },
  updateFilesKeywords: (filesID, keywords) => {}
}
