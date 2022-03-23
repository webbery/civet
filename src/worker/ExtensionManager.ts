import path from 'path'
import { ExtensionActiveType, ExtensionService, ExtensionAccessor } from './ExtensionService'
import { MessagePipeline } from './MessageTransfer'
import { Resource, StorageAccessor } from '@/../public/Resource'
import { ResourcePath } from './common/ResourcePath'
import { Result } from './common/Result'
import { config } from '@/../public/CivetConfig'
import { APIFactory } from './ExtensionAPI'
import { isFileExist, getExtensionPath} from '@/../public/Utility'
import { CivetDatabase } from './Kernel'
import { PropertyType } from '../public/ExtensionHostType'
import { ExtensionInstallManager, ExtensionDescriptor } from './ExtensionInstallManager'
import fs from 'fs'
import { injectable, showErrorInfo, getSingleton } from './Singleton'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import { ExtensionPackage, ExtensionType, MenuDetail } from './ExtensionPackage'
import { BaseService, IStorageService } from './service/ServiceInterface'
import { StorageService } from './service/StorageService'
import { ViewService } from './service/ViewService'
import { BackgroundService } from './service/BackgroundService'
import { Emitter } from 'public/Emitter'
import { createMixService as applyMixService, MixService } from './service/MixService'
import { ExtensionModule } from './api/ExtensionRequire'
import { IResource, ResourceProperty } from 'civet'

class ExtensionCommandAccessor implements ExtensionAccessor {
  #commands: Set<string>;
  #overview: string;
  constructor(overview: string) {
    this.#overview = overview
    this.#commands = new Set<string>()
  }

  visit(service: ExtensionService) {
    this.menu(service)
  }

  result() {
    return this.#commands
  }

  private menu(service: ExtensionService) {
    const m = service.menus
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

  visit(service: ExtensionService) {
    const m = service.menus
    const items: MenuDetail[] = m[this.#context]
    if (items) {
      this.#menus = this.#menus.concat(items)
    }
  }

  result(){
    return this.#menus
  }
}

class MenuCommand {
  group: string;
  command: string;
  name: string;
  id: string;
}
class ExtensionAllMenuAccessor implements ExtensionAccessor {
  #menus: any[] = [];

  visit(service: ExtensionService) {
    const m = service.menus
    for (let context in m) {
      const items: MenuDetail[] = m[context]
      console.info('context:', context, items)
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
  private _extensions: ExtensionService[] = []; //
  #extensionPackages: Map<string,ExtensionPackage> = new Map<string,ExtensionPackage>(); // name, extension package
  #services: Map<string, BaseService> = new Map<string, BaseService>();
  #extensionsOfContentType: Map<string,BaseService[]> = new Map<string, BaseService[]>();  // contentType, service
  #storageService: StorageService[] = [];
  private _activableExtensions: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();  // contentType, service
  private _viewServices: Map<string, ExtensionService> = new Map<string, ExtensionService>();
  private _installManager: ExtensionInstallManager|null = null;
  // private _algorithmService: AlgorithmService = null;

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
    // this._installRouter()
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
      // clean service that is not in the config
      for (let idx = this._extensions.length; idx >= 0; ++idx) {
        let name = this._extensions[idx].name
        console.info('key', name)
        if (visited[name] === undefined) {
          this._extensions.splice(idx)
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
    if (pack.extensionType & ExtensionType.ViewExtension) {
      mixCtor.push(ViewService)
    }
    if (pack.extensionType & ExtensionType.BackgroundExtension) {
      mixCtor.push(BackgroundService)
    }
    if (pack.extensionType & ExtensionType.StorageExtension) {
      mixCtor.push(StorageService)
    }
    applyMixService(MixService, mixCtor)
    return new MixService(pack)
  }

  private initialize(name: string, entryPath: string): any {
    if (!fs.existsSync(entryPath)) {
      const msg = `file not exist: ${entryPath}`
      showErrorInfo({msg: msg})
      return null
    }
    const content = fs.readFileSync(entryPath, 'utf-8')
    const pipe = getSingleton(MessagePipeline)
    const m = new ExtensionModule(name, module.parent, pipe!)
    m._compile(content, name)
    console.debug(`initialize ${name}:${m.exports}`)
    try {
      // m.exports.run()
      let instance = null
      if (m.exports.activate) {
        instance = m.exports.activate()
      }
      if (!instance) {
        const msg = `${name}'s activate is not defined.`
        console.error(msg)
        return null
      }
      return instance
    } catch (error) {
      const msg = `initialize ${name} fail: ${error}`
      showErrorInfo({msg: msg})
      return null
    }
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
        if (!(pack.extensionType & ExtensionType.ViewExtension)) return false
        const service = this.createServiceByPackage(pack)
        const instance = this.initialize(pack.name, pack.main)
        service.service = instance
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
        const instance = self.initialize(pack.name, pack.main)
        service.service = instance
        self.services.set(name, service)
      }
      return service
    }
    for(const pack of this.#extensionPackages) {
      if (!(pack[1].extensionType & ExtensionType.BackgroundExtension)) continue
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

  install(msgid: number, extinfo: any) {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    const result = this._installManager!.install(extinfo.name, extinfo.version)
    if (result) {
      // load extension
      const root = getExtensionPath()
      this._initPackageAndViewService(root, extinfo.name, this._pipeline)
    }
    return {type: IPCRendererResponse.install, data: result}
  }

  uninstall(msgid: number, extname: string) {
    const extPath = getExtensionPath()
    this._initInstaller(extPath)
    const result = this._installManager!.uninstall(extname)
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
    this._extensions.forEach((service: ExtensionService) => {
      menuAccessor.visit(service)
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
    this._extensions.forEach((service: ExtensionService) => {
      cmdAccessor.visit(service)
    })
    return {type: IPCRendererResponse.getActiveCmd, data: Array.from(cmdAccessor.result())}
  }

  onRecieveCommand(msgid: number, data: any) {
    const command = data.command
    const target = data.target
    const args = data.args
    this.onExecuteCommand(target, command, args)
  }

  private _initContentTypeExtension(service: ExtensionService) {
    let activeType = service.activeType()
    if (!activeType) return
    for (let active of activeType) {
      active = active.toLowerCase()
      let events = this._activableExtensions.get(active)
      if (!events) {
        events = []
      }
      events.push(service)
      this._activableExtensions.set(active, events)
    }
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

  getExtensionsByType(extensionType: ExtensionActiveType): ExtensionService[] {
    let extensions: ExtensionService[] = []
    for (let idx = 0, len = this._extensions.length; idx < len; ++idx) {
      const extension = this._extensions[idx]
      if (extension.hasType(extensionType)) {
        extensions.push(extension)
      }
    }
    return extensions
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
    const services = this.#extensionsOfContentType.get(extname)
    for (const service of services!) {
      console.debug(service.name, 'emit read')
      service.emit('read', msgid, resource.id, uri.local(), resource)
    }
    // for (const extension of extensions) {
    //   await extension.run('read', uri.local(), resource)
    // }
    // console.info('add files:', resource)
    // const accessor = new StorageAccessor()
    // const store = resource.toJson(accessor)
    // CivetDatabase.addFiles([store])
    // const thumbnail = resource.getPropertyValue('thumbnail')
    // if (thumbnail) {
    //   CivetDatabase.addMeta([resource.id], { name: 'thumbnail', value: thumbnail, type: 'bin' })
    // }
    // const colors = resource.getPropertyValue('color')
    // if (colors) {
    //   CivetDatabase.addMeta([resource.id], { name: 'color', value: colors, type: 'color', query: true })
    // }
    return Result.success(resource)
  }

  async onExecuteCommand(id: string, command: string, ...args: any) {
    console.info(`Execute command ${command} on ${id}, params is ${args}`)
    const extensions = this._activableExtensions.get(id)
    if (!extensions || extensions.length === 0) {
      const msg = `No extensions can read ${id} file`
      showErrorInfo({msg: msg})
      return Result.failure(msg)
    }
    const [kind, cmd] = command.split(':')
    if (kind === 'ext') {
      for (const extension of extensions) {
        await extension.run(cmd, args)
      }
    } else {
      console.error('unknow command', command)
    }
    return Result.success(true)
  }
}
