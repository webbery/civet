import path from 'path'
import { MessagePipeline } from './MessageTransfer'
import { Resource, StorageAccessor } from '@/../public/Resource'
import { ResourcePath } from './common/ResourcePath'
import { Result } from './common/Result'
import { config } from '@/../public/CivetConfig'
import { APIFactory } from './ExtensionAPI'
import { isFileExist, getExtensionPath} from '@/../public/Utility'
import { PropertyType } from '../public/ExtensionHostType'
import { ExtensionInstallManager, ExtensionDescriptor } from './ExtensionInstallManager'
import fs from 'fs'
import { injectable, showErrorInfo, getSingleton } from './Singleton'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import { ExtensionPackage, ExtensionActiveType, MenuDetail } from './ExtensionPackage'
import { BaseService, IStorageService } from './service/ServiceInterface'
import { StorageService } from './service/StorageService'
import { ViewService } from './service/ViewService'
import { BackgroundService } from './service/BackgroundService'
import { createMixService as applyMixService, MixService } from './service/MixService'
import { ExtensionModule } from './api/ExtensionRequire'
import { ExtSearchBarManager } from './view/extHostSearchBar'
import { IResource, ResourceProperty } from 'civet'

export interface ExtensionAccessor {
  visit(extension: ViewService): void;
  result(): any;
}

class ExtensionCommandAccessor implements ExtensionAccessor {
  #commands: Set<string>;
  #overview: string;
  constructor(overview: string) {
    this.#overview = overview
    this.#commands = new Set<string>()
  }

  visit(service: ViewService) {
    this.menu(service)
  }

  result() {
    return this.#commands
  }

  private menu(service: ViewService) {
    const m = service.menus()
    const items: MenuDetail[] = m[this.#overview]
    if (items) {
      for (let item of items) {
        this.#commands.add(item.command)
      }
    }
  }
}

class ExtensionMenuAccessor implements ExtensionAccessor {
  #menus: MenuDetail[] = [];
  #context: string;

  constructor(context: string) {
    this.#context = context
  }

  visit(service: ViewService) {
    const m = service.menus()
    const items: MenuDetail[] = m[this.#context]
    if (items) {
      this.#menus = this.#menus.concat(items)
    }
  }

  result(){
    return this.#menus
  }
}

class ExtensionAllMenuAccessor implements ExtensionAccessor {
  #menus: any[] = [];

  visit(service: ViewService) {
    const m = service.menus()
    for (let context in m) {
      const items: MenuDetail[] = m[context]
      for (let item of items) {
        this.#menus.push({
          id: context,
          name: item.name,
          group: item.group,
          command: item.command
        })
      }
    }
  }

  result() { return this.#menus }
}

@injectable
export class ExtensionManager {
  private _pipeline: MessagePipeline;
  // aviable extension of this
  private _extensionsOfConfig: string[] = [];
  // private _extensions: ExtensionService[] = []; //
  #extensionPackages: Map<string,ExtensionPackage> = new Map<string,ExtensionPackage>(); // name, extension package
  #services: Map<string, BaseService> = new Map<string, BaseService>();
  #extensionsOfContentType: Map<string,BaseService[]> = new Map<string, BaseService[]>();  // contentType, service
  #extensionOfCommand: Map<string, BaseService[]> = new Map<string, BaseService[]>();
  #storageService: StorageService[] = [];
  private _installManager: ExtensionInstallManager|null = null;

  constructor(pipeline: MessagePipeline) {
    this._pipeline = pipeline
    const dbname = config.getCurrentDB()
    const resource = config.getResourceByName(dbname!)
    this._extensionsOfConfig = (!resource || resource['extensions'] === undefined) ? [] : resource['extensions']

    let extensionPath = getExtensionPath()
    console.info('extension path:', extensionPath)
    if (!fs.existsSync(extensionPath)) return
    let exts = fs.readdirSync(extensionPath)
    // remove files
    for (let idx = exts.length - 1; idx >= 0; --idx) {
      // console.info(exts[idx])
      if (fs.statSync(extensionPath + '/' + exts[idx]).isDirectory() && this._isExtension(exts[idx])) continue
      exts.splice(idx, 1)
    }
    this._initServices(extensionPath, exts, pipeline)
    this._buildGraph()
    // npm extension
    this._initExternalExtension()
    this._initFrontEndEvent(pipeline)
    this._initCommandExtension()
    // storage service for test
    this.#storageService.push(new StorageService())
  }

  get services() { return this.#services; }
  private _isExtension(name: string) {
    if (name === 'node_modules' || name === '.DS_Store') return false
    return true
  }

  private _initServices(root: string, extensionsName: string[], pipeline: MessagePipeline) {
    if (this._extensionsOfConfig.length === 0) {
      this._initRestService(root, extensionsName, pipeline)
    } else {
      let visited = {}
      for (let name of this._extensionsOfConfig) {
        if (this._initPackageAndViewService(root, name, pipeline)) {
          visited[name] = name
        }
      }
    }
  }

  private _initRestService(root: string, extensionsName: string[], pipeline: MessagePipeline) {
    for (let name of extensionsName) {
      this._initPackageAndViewService(root, name, pipeline)
    }
  }

  private createServiceByPackage(pack: ExtensionPackage): BaseService {
    let mixCtor = []
    if (pack.extensionType & ExtensionActiveType.ViewExtension) {
      mixCtor.push(ViewService)
    }
    if (pack.extensionType & ExtensionActiveType.BackgroundExtension) {
      mixCtor.push(BackgroundService)
    }
    if (pack.extensionType & ExtensionActiveType.StorageExtension) {
      mixCtor.push(StorageService)
    }
    if (pack.extensionType & ExtensionActiveType.Command) {
    }
    applyMixService(MixService, mixCtor)
    return new MixService(pack)
  }

  private initialize(pack: ExtensionPackage): ExtensionModule {
    if (!fs.existsSync(pack.main)) {
      const msg = `file not exist: ${pack.main}`
      showErrorInfo({msg: msg})
      throw new Error(msg)
    }
    const content = fs.readFileSync(pack.main, 'utf-8')
    const pipe = getSingleton(MessagePipeline)
    const m = new ExtensionModule(pack.name, module.parent, pipe!)
    m._compile(content, pack.name)
    console.debug(`initialize ${pack.name}:${JSON.stringify(m.exports)}`)
    return m
  }

  /**
   * return true if create new service, else return false
   */
  private _initPackageAndViewService(root: string, extensionName: string, pipeline: MessagePipeline): boolean {
    try {
      if (!this.#extensionPackages.has(extensionName)) {
        const packPath = root + '/' + extensionName
        const pack = new ExtensionPackage(packPath)
        this.#extensionPackages.set(extensionName, pack)
        if (!(pack.extensionType & ExtensionActiveType.ViewExtension)) return false
        const service = this.createServiceByPackage(pack)
        const instance = this.initialize(pack)
        if (!instance) return false
        service.module = instance
        this.#services.set(service.name, service)
        return true
      }
    } catch (err) {
      console.error(`init extension ${extensionName} fail: ${err}`)
    }
    return false
  }

  private _buildGraph() {
    const _createMixService = function(name: string, pack: ExtensionPackage, self: ExtensionManager) {
      let service = self.services.get(name)
      if (!service) {
        service = self.createServiceByPackage(pack)
        const instance = self.initialize(pack)
        if (instance) service.module = instance
        self.services.set(name, service)
      }
      return service
    }
    for(const pack of this.#extensionPackages) {
      if (!(pack[1].extensionType & ExtensionActiveType.BackgroundExtension)) continue
      // console.debug(pack[0], 'extension type', pack[1].extensionType, pack[1].extensionType & ExtensionType.BackgroundExtension)
      const dependencies = pack[1].dependency
      if (!dependencies) {
        const service = _createMixService(pack[0], pack[1], this)
        const types = service.activeType()
        for (const type of types) {
          let services = this.#extensionsOfContentType.get(type)
          if (!services) services = [service]
          else services.push(service)
          this.#extensionsOfContentType.set(type, services)
        }
        service.storageEmitter = true
        continue
      }
      let next = this.#services.get(pack[0])
      if (!next) {
        next = _createMixService(pack[0], this.#extensionPackages.get(pack[0])!, this)
        next.storageEmitter = true
      }
      for (const dependency in dependencies) {
        console.debug(pack[0], 'dependency is', dependency)
        const service = _createMixService(dependency, this.#extensionPackages.get(dependency)!, this)
        service.addNext(next!)
      }
    }
  }

  private _initFrontEndEvent(pipeline: MessagePipeline) {
    pipeline.regist(IPCNormalMessage.INSTALL_EXTENSION, this.install, this)
    pipeline.regist(IPCNormalMessage.UNINSTALL_EXTENSION, this.uninstall, this)
    pipeline.regist(IPCNormalMessage.UPDATE_EXTENSION, this.update, this)
    pipeline.regist(IPCNormalMessage.LIST_EXTENSION, this.installedList, this)
    pipeline.regist(IPCNormalMessage.GET_OVERVIEW_MENUS, this.replyMenus, this)
    pipeline.regist(IPCNormalMessage.POST_COMMAND, this.onRecieveCommand, this)
  }

  private _initCommandExtension() {
    for(const pack of this.#extensionPackages) {
      for (const command of pack[1].activeCommands) {
        let service = this.#services.get(pack[0])
        if (!service) {
          service = this.createServiceByPackage(pack[1])
          service.module = this.initialize(pack[1])
          this.#services.set(pack[0], service)
        }
        let commandOfServices = this.#extensionOfCommand.get(command)
        if (!commandOfServices) commandOfServices = [service]
        else commandOfServices.push(service)
        this.#extensionOfCommand.set(command, commandOfServices)
      }
    }
  }

  private _initInstaller(extensionPath: string) {
    if (this._installManager === null) {
      this._installManager = new ExtensionInstallManager(extensionPath)
    }
  }
  
  _initExternalExtension() {
    const extPath = getExtensionPath()
    const extConfig = extPath + '/package.json'
    if (isFileExist(extConfig)) {
      const pkg = fs.readFileSync(extConfig)
      const exts = pkg['dependencies']
      console.info('external extension:', exts)
      // for (let ext of exts) {
      // }
    }
  }

  postStartupCommand() {
    const activate = function (extens: Map<string, BaseService[]>, cmd: string) {
      const services = extens.get(cmd)
      console.debug('startup service', services)
      for (const serv of services!) {
        serv.activate()
      }
    }
    // read startup command of config
    const curDB = config.getCurrentDB() || ''
    const db = config.getResourceByName(curDB)
    const commands = db['command'] || []
    for (const cmd of commands) {
      activate(this.#extensionOfCommand, cmd)
    }
    // use default command
    if (commands.length === 0) {
      activate(this.#extensionOfCommand, 'std.search')
    }
    // update search bar
    const searchBar = getSingleton(ExtSearchBarManager)
    searchBar!.initSearchBarFinish()
  }

  async broadcastCommand(command: string, ...args: any) {
    for (let item of this.#extensionPackages) {
      if (item[1].viewEvents & ExtensionActiveType.StorageExtension) {
        const service = this.#services.get(item[0])
        if (!service) continue
        const results = await service.envoke(command, args)
        if (results) {
          const pipe = getSingleton(MessagePipeline)
          pipe?.post(command, results)
        }
      }
    }
  }

  async install(msgid: number, extinfo: any) {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    const result = await this._installManager!.install(extinfo.name, extinfo.version)
    if (result) {
      // load extension
      const root = getExtensionPath()
      try {
        console.debug('install', root, extinfo)
        this._initPackageAndViewService(root, extinfo.name, this._pipeline)
        this.#services.get(extinfo.name)!.activate()
      } catch (err: any) {
        console.error('install', err)
      }
    }
    return {type: IPCRendererResponse.install, data: result}
  }

  async uninstall(msgid: number, extname: string) {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    const result = await this._installManager!.uninstall(extname)
    return {type: IPCRendererResponse.uninstall, data: result}
  }

  update(msgid: number, extname: string) {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    this._installManager!.update(extname)
    // let extPackPath = this._extensionPath + '/' + extname + '/package.json'
    // if (!isFileExist(extPackPath)) return
  }

  installedList(msgid: number): any {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    const list = this._installManager!.installList()
    return {type: IPCRendererResponse.getExtensions, data: list}
  }

  enable(msgid: number, extname: string) {
  }

  disable(msgid: number, extname: string) {}

  accessMenu(menuAccessor: ExtensionAccessor) {
    this.#services.forEach((service: BaseService) => {
      menuAccessor.visit(service as ViewService)
    })
    const menus = menuAccessor.result()
    return {type: IPCRendererResponse.getOverviewMenus, data: menus}
  }

  replyMenus(msgid: number, context: string|undefined) {
    if (context) {
      let menuAccessor: ExtensionMenuAccessor = new ExtensionMenuAccessor(context);
      return this.accessMenu(menuAccessor)
    }
    let menuAccessor: ExtensionAllMenuAccessor = new ExtensionAllMenuAccessor()
    return this.accessMenu(menuAccessor)
  }

  replyAllCommand(msgid: number) {
    let cmdAccessor: ExtensionCommandAccessor = new ExtensionCommandAccessor(config.defaultView)
    this.#services.forEach((service: BaseService) => {
      cmdAccessor.visit(service as ViewService)
    })
    return {type: IPCRendererResponse.getActiveCmd, data: Array.from(cmdAccessor.result())}
  }

  onRecieveCommand(msgid: number, data: any) {
    const command = data.command
    const target = data.target
    const args = data.args
    this.onExecuteCommand(target, command, args)
  }

  emitStorageEvent(msgid: number, resourceId: number, properties: ResourceProperty[], resource: Resource) {
    console.debug('storage service', this.#storageService, 'props:', properties)
    for(let service of this.#storageService) {
      // service.emit('save', msgid, resourceId, properties)
      // let storage = service as MixService
      service.onUpdateEvent(msgid, resourceId, properties, resource)
    }
  }

  // enable resource's extensions
  switchResourceDB(dbname: string) {
    const resource = config.getResourceByName(dbname)
    if (!resource) {}
    // this._extensionsOfConfig = resource['extensions']
  }

  activeAllService() {
    console.debug('begin active extension')
    for (const service of this.#services) {
      service[1].activate()
    }
    console.debug('finish active extension')
  }

  async read(msgid: number, uri: ResourcePath): Promise<Result<Resource, string>> {
    const f = path.parse(uri.local())
    const extname = f.ext.substr(1).toLowerCase()
    const extensions = this.#extensionsOfContentType.get(extname)
    if (!extensions || extensions.length === 0) {
      const msg = `No extensions can read ${extname} file`
      showErrorInfo({msg: msg})
      return Result.failure(msg)
    }
    let resource: Resource = APIFactory.createResource(this._pipeline);
    resource.filename = f.base
    resource.path = uri.local()
    if (uri.remote()) {
      resource.remote = uri.remote()
    }
    resource.filetype = extname
    resource.putProperty({ name: 'type', value: extname, type: PropertyType.String, query: true, store: true })
    resource.putProperty({ name: 'filename', value: f.base, type: PropertyType.String, query: true, store: true })
    resource.putProperty({ name: 'path', value: uri.local(), type: PropertyType.String, query: false, store: true })
    this.emitStorageEvent(msgid, resource.id, resource.getProperties(), resource)
    const services = this.#extensionsOfContentType.get(extname)
    for (const service of services!) {
      console.debug(service.name, 'emit read')
      service.emit('read', msgid, resource.id, uri.local(), resource)
    }
    return Result.success(resource)
  }

  async onExecuteCommand(id: string, command: string, ...args: any) {
    // console.info(`Execute command ${command} on ${id}, params is ${args}`)
    // const extensions = this._activableExtensions.get(id)
    // if (!extensions || extensions.length === 0) {
    //   const msg = `No extensions can read ${id} file`
    //   showErrorInfo({msg: msg})
    //   return Result.failure(msg)
    // }
    // const [kind, cmd] = command.split(':')
    // if (kind === 'ext') {
    //   for (const extension of extensions) {
    //     await extension.run(cmd, args)
    //   }
    // } else {
    //   console.error('unknow command', command)
    // }
    return Result.success(true)
  }

  getSupportContentType() {
    let supports = []
    for (const extension of this.#extensionsOfContentType) {
      supports.push(extension[0])
    }
    return supports
  }
}
