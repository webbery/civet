const kernel = (function () {
  // const {remote} = require('electron')
  // const fs = require('fs')
  // const userDir = remote.app.getPath('userData')
  // const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
  // const config = JSON.parse(fs.readFileSync(configPath))
  // const dbname = config.db.path
  const instance = require('civetkern')
  return instance.civetkern
})()

export default {
  init: (cfg) => { return kernel.init(cfg) },
  addOrUpdateFiles: (src) => { return kernel.addOrUpdateFiles(src) }
}
