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
  generateFilesID: (num) => { return kernel.generateFilesID(num) },
  addFiles: (src) => { return kernel.addFiles(src) },
  getFilesSnap: (flag) => { return kernel.getFilesSnap(flag) },
  findFiles: (condition) => { return kernel.findFiles(condition) }
}
