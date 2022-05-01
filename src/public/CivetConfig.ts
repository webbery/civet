const fs = require('fs')
/**
 * cfg.json describe as follows:
 {
   app: {
      first: true,      // is civet application first open?
      version: version, // the version of current civet
      default: {
        dbname: dbname,  // last used database/resources library name
        layout: mapview,  // default layout of overview
      }
    },
    resources: [
      {
        name: name,     // avaliable database/resources name
        db: {
          path: path    // database file path
        },
        extensions: [
          // avaliable extensions in this database/resources library. Default is all
          // if we create a database/resources library, an support content type should be selected.
          // after that, relational extension will be added to here for recording.
          // if we don't select content type, can all extension be automatic enable?
          // for example, which overview should be display? it seems that it's not important, because user know what they want.
          extension
        ],
        meta: schema,
        command: [
          // active command on start up
          // default is `std.search`
          // `std.search` means using civet standard search tool
        ]
      }
    ]
  }
 */
class CivetConfig {
  configPath: string;
  config: any;
  oldVersion: boolean = false;
  #lastModify: number = 0;

  constructor() {
    const app = require('./System').default.app()
    const civet = require('../../package.json')
    const version = civet.version
    console.info('version:', version)
    const userDir = app.getPath('userData')
    this.configPath = (app.isPackaged ? userDir + '/cfg.json' : './cfg.json')
    let cfg = {
      app: {
        first: true,
        version: version,
        default: {
          layout: 'gridview'
        }
      },
      resources: []
    }
    console.info('cfgPath', this.configPath)
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(cfg))
    } else {
      const config = JSON.parse(fs.readFileSync(this.configPath))
      // cfg.app.first = false
      if (!config.app.version || config.app.version !== version) {
        // upgrade config here
        console.info(`software should be upgrade, old version: ${config.app.version}, current version: ${version}`)
        this.oldVersion = true;
        config.app.version = version
        if (typeof config.app.default === 'string') { // 0.1.2 -> 0.2.0
          const dbname = config.app.default
          config.app.default = {layout: 'gridview', dbname: dbname}
        }
      }
      cfg = config
    }
    this.#lastModify = this.getModifyTime()
    this.config = cfg
  }

  private getModifyTime(): number {
    const stat = fs.statSync(this.configPath)
    return stat.mtime.getTime()
  }

  getConfig(reload: boolean) {
    if (reload) {
      this.config = this.loadConfig()
    }
    return this.config
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath))
  }

  getCurrentDB(): string|undefined {
    return this.config.app.default['dbname']
  }

  getDBPath(name: string|undefined): string | null {
    if (!name) {
      name = this.config.app.default['dbname']
    }
    for (const resource of this.config.resources) {
      if (name === resource.name) {
        return resource.db.path
      }
    }
    return null
  }

  get defaultView() {
    return this.config.app.default.layout
  }

  set defaultView(val: string) {
    this.config.app.default.layout = val
  }

  meta() {
    for (const resource of this.config.resources) {
      if (this.config.app.default['dbname'] === resource.name) {
        return resource.meta
      }
    }
    return null
  }

  isFirstTime() {
    // const defaultName = this.config.app.default
    // const dbpath = this.getDBPath(defaultName)
    // if (!fs.existsSync(dbpath)) {
    //   this.config.app.first = true
    // }
    return this.config.app.first
  }

  isDBFileExist(name: string) {
    const path = this.getDBPath(name)
    console.info('is db exist:', path)
    return fs.existsSync(path)
  }

  switchResource(name: string) {
    this.config.app.default['dbname'] = name
  }

  getResourcesName(): string[] {
    const resources = []
    for (const resource of this.config.resources) {
      resources.push(resource.name)
    }
    return resources
  }

  getResourceByName(name: string) {
    for (const resource of this.config.resources) {
      if (resource.name === name) return resource
    }
    return null
  }

  getRecentResources() {}

  addResource(name: string, path: string) {
    for (const resource of this.config.resources) {
      if (resource.name === name) {
        resource.db.path = path
        return
      }
    }
    this.config.app.first = false
    if (typeof this.config.app.default === 'string') { // update
      const dbname = this.config.app.default
      this.config.app.default = {layout: 'mapview', dbname: dbname}
    }
    this.config.app.default['dbname'] = name
    this.config.resources.push({
      name: name,
      db: { path: path + '/' + name },
      extensions: [],
      meta: this.schema(),
      command: [
        'std.search'
      ]
    })
  }

  isMetaDisplay(name: string, meta: any) {
    console.info('meta name:', name)
    for (const item of meta) {
      if (item.name === name && item.display === true) return true
    }
    return false
  }

  save() {
    console.info('save config', this.config)
    const modifyTime = this.getModifyTime()
    if (modifyTime > this.#lastModify) {
      console.info('merge new config')
      this.merge()
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config))
  }

  private isValidDB(name: string, resources: any): number {
    for (let idx = 0, len = resources.length; idx < len; ++idx) {
      if (resources[idx].name === name) return idx
    }
    return -1
  }

  private merge() {
    const latest = this.loadConfig()
    if (latest['resources'].length != this.config['resources']) {
      this.config['resources'] = latest['resources']
      let defaultInfo = this.config['app'].default
      const idx = this.isValidDB(defaultInfo.dbname, latest['resources'])
      if (idx < 0) {
        this.config['app'].default.name = latest['app'].default.name
      }
    }
    this.config['app'].default.layout = latest['app'].default.layout
  }
  
  shouldUpgrade() {
    return this.oldVersion;
  }

  removeResource(name: string) {
    const fullpath = this.getDBPath(name)
    console.info('remove path:', fullpath)
    if (fullpath !== null) {
      fs.rmdirSync(fullpath, { recursive: true })
    }
    const resources = this.config.resources
    for (let idx = 0; idx < resources.length; ++idx) {
      if (resources[idx].name === name) {
        resources.splice(idx, 1)
        break
      }
    }
    if (this.config.app.default['dbname'] === name) {
      this.config.app.default['dbname'] = resources[0]
    }
    this.save()
  }

  get version() {
    return this.config.app.version
  }

  addExtension(dbname: string, extension: string) {
    const resource = this.getResourceByName(dbname)
    if (!resource['extensions']) {
      resource['extensions'] = []
    }
    for (let ext of resource['extensions']) {
      if (ext === extension) return
    }
    resource['extensions'].push(extension)
  }

  getExtensions(dbname: string) {
    const resource = this.getResourceByName(dbname)
    return resource['extensions']
  }

  schema(filetype: string = 'img') {
    /**
     * {
     *  name: name,
     *  db: { path: path + '/' + name },
     *  extensions: [id...],
     *  meta: this.schema()
     * }
     */
    return [
      { name: 'color', value: '主色', type: 'val/array', query: true, size: 3, display: true },
      { name: 'size', value: '大小', type: 'str', query: true, display: true },
      { name: 'path', value: '路径', type: 'str', display: true },
      { name: 'filename', value: '文件名', type: 'str', display: true },
      { name: 'type', value: '类型', type: 'str', query: true, display: true },
      { name: 'datetime', value: '创建时间', type: 'date', query: true, display: true },
      { name: 'addtime', value: '添加时间', type: 'date', query: true, display: true },
      { name: 'width', value: '宽', type: 'str', display: true },
      { name: 'height', value: '高', type: 'str', display: true }
    ]
  }

  getActiveCommand(name: string): string[] {
    const resource = this.getResourceByName(name)
    return resource['command']
  }
}

export const config = new CivetConfig()
