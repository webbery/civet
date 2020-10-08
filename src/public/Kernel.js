const kernel = (function () {
  const {remote} = require('electron')
  const fs = require('fs')
  const userDir = remote.app.getPath('userData')
  const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
  const config = JSON.parse(fs.readFileSync(configPath))
  const instance = require('civetkern')
  let flag = 0
  if (process.argv[process.argv.length - 1] === 'renderer') {
    flag = 1
  }
  if (!instance.civetkern.init(config, flag)) {
    console.info('init fail')
  }
  return instance.civetkern
})()

export default {
  getFilesSnap: (flag) => { return kernel.getFilesSnap(flag) },
  getFilesInfo: (filesID) => { return kernel.getFilesInfo(filesID) },
  findFiles: (condition) => { return kernel.findFiles(condition) },
  // 以下接口为可写接口
  generateFilesID: (num) => { return kernel.generateFilesID(num) },
  addFiles: (src) => { return kernel.addFiles(src) }
}
