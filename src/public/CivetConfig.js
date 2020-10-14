const fs = require('fs')
export class CivetConfig {
  constructor() {
    let app = null
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
          meta: [
            {name: 'color', value: '主色', type: 'val/array', query: true, size: 3, display: true},
            {name: 'path', value: '路径', type: 'str', display: true},
            {name: 'filename', value: '文件名', type: 'str', display: true},
            {name: 'type', value: '类型', type: 'str', display: true}
          ]
        }
      ]
    }
    console.info('cfgPath', this.configPath)
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(cfg))
    } else {
      cfg = JSON.parse(fs.readFileSync(this.configPath))
      // cfg.app.first = false
    }
    this.config = cfg
  }

  getConfig() {
    return this.config
  }

  meta() {
    for (let resource of this.config.resources) {
      if (this.config.app.default === resource.name) {
        return resource.meta
      }
    }
    return null
  }

  isFirstTime() {
    return this.config.app.first
  }

  switchResource(name) {}

  getResourcesName() {
    let resources = []
    for (let resource of this.config.resources) {
      resources.push(resource.name)
    }
    return resources
  }
  save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config))
  }
}
