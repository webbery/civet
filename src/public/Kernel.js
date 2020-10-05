const kernel = (function () {
  const {remote} = require('electron')
  const fs = require('fs')
  const userDir = remote.app.getPath('userData')
  const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
  const config = JSON.parse(fs.readFileSync(configPath))
  // const dbname = config.db.path
  const instance = require('civetkern')
  if (!instance.civetkern.init(config)) {
    console.info('init fail')
  }
  console.info('require(caxio)')
  return instance.civetkern
})()

export default {
  generateFilesID: (num) => { return kernel.generateFilesID(num) },
  addFiles: (src) => { return kernel.addFiles(src) },
  getFilesSnap: (flag) => { return kernel.getFilesSnap(flag) },
  findFiles: (condition) => { return kernel.findFiles(condition) }
}
