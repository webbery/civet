import path from 'path'
import { ExtensionActiveType, ExtensionService, MenuDetail, ExtensionAccessor } from './ExtensionService'
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
import { logger } from '@/../public/Logger'
import fs from 'fs'
import { injectable, showErrorInfo } from './Singleton'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'

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
  private _extensionsOfConfig: string[] = [];
  private _extensions: ExtensionService[] = []; //
  private _activableExtensions: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();  // contentType, service
  private _viewServices: Map<string, ExtensionService> = new Map<string, ExtensionService>();
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
    // console.info('-------', exts)
    this._initServices(extensionPath, exts, pipeline)
    this._buildGraph()
    // console.info('graph:', this._actives)
    // npm extension
    this._initExternalExtension()
    this._initFrontEndEvent(pipeline)
    // this._installRouter()
  }

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
        if (this._initService(root, name, pipeline)) {
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
      this._initService(root, name, pipeline)
    }
  }

  /**
   * return true if create new service, else return false
   */
  private _initService(root: string, extensionName: string, pipeline: MessagePipeline): boolean {
    let service = this._getService(extensionName)
    try {
      if (!service) {
        const packPath = root + '/' + extensionName
        service = new ExtensionService(packPath, pipeline)
        this._extensions.push(service)
        console.info('extension name:', extensionName)
        return true
      }
    } catch (err) {
      console.error(`init extension ${extensionName} fail: ${err}`)
    }
    return false
  }

  private _buildGraph() {
    this._activableExtensions.clear()
    console.info('service:', this._extensions)
    let extServs: ExtensionService[] = this._extensions
    console.info('service:', extServs)
    // build dependent service
    for (let idx = 0, len = extServs.length; idx < len; ++idx) {
      let service = extServs[idx]
      if (!service.dependency) continue
      for (let pos = 0; pos < len; ++pos) {
        if (service.dependency === extServs[pos].name) {
          extServs[pos].addDependency(service)
          break
        }
      }
    }
    // check if loop circle exist
    // build empty dependent service
    for (let idx = extServs.length - 1; idx >= 0; --idx) {
      let service = extServs[idx]
      console.info('service:', service)
      if (!service.dependency) {
        this._initContentTypeExtension(service)
        this._initViewExtension(service)
        this._initStorageExtension(service)
      }
    }
  }

  private _getService(name: string) {
    for (let service of this._extensions) {
      if (service.name === name) return service
    }
    return null
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
      this._initService(root, extinfo.name, this._pipeline)
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

  private _initViewExtension(service: ExtensionService) {
    let activeType = service.viewType()
    if (!activeType) return
    this._viewServices.set(service.name, service)
  }

  private _initStorageExtension(service: ExtensionService) { }

  switchResourceDB(dbname: string) {
    const resource = config.getResourceByName(dbname)
    this._extensionsOfConfig = resource['extensions']
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

  async read(uri: ResourcePath): Promise<Result<Resource, string>> {
    const f = path.parse(uri.local())
    const extname = f.ext.substr(1).toLowerCase()
    const extensions = this._activableExtensions.get(extname)
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
    for (const extension of extensions) {
      await extension.run('read', uri.local(), resource)
      // this._pipeline.post(ReplyType.WORKER_UPDATE_RESOURCES, [resource.toJson()])
    }
    console.info('add files:', resource)
    const accessor = new StorageAccessor()
    const store = resource.toJson(accessor)
    CivetDatabase.addFiles([store])
    CivetDatabase.addMeta([resource.id], { name: 'thumbnail', value: resource.getPropertyValue('thumbnail'), type: 'bin' })
    CivetDatabase.addMeta([resource.id], { name: 'color', value: resource.getPropertyValue('color'), type: 'color', query: true })
    return Result.success(resource)
  }

  async onExecuteCommand(id: string, command: string, ...args: any) {
    console.info(`Execute command ${command} on ${id}, params is ${args}`)
    const extensions = this._activableExtensions[id]
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
