const fs = require('fs')
export class CivetConfig {
  constructor() {
    let app = null
    console.info(process.type)
    if (process.type === 'browser') {
      app = require('electron').app
    } else {
      app = require('electron').remote.app
    }
    const userDir = app.getPath('userData')
    this.configPath = (app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
    let cfg = {
      app: {
        first: true,
        default: '图像库'
      },
      resources: [
        {
          name: '图像库',
          db: {
            path: userDir + '/civet'
          },
          linkdir: userDir + '/resource',
          meta: [
            {name: 'color', value: '主色', type: 'val/array', db: true, size: 3}
          ]
        }
      ]
    }
    console.info('cfgPath', this.configPath)
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(cfg))
    } else {
      JSON.parse(fs.readFileSync(this.configPath))
      cfg.app.first = false
    }
    this.config = cfg
  }

  getConfig() {
    return this.config
  }

  isFirstTime() {
    return this.config.app.first
  }

  save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config))
  }
}
