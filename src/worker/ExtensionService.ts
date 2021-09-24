import { MessagePipeline } from './MessageTransfer'
import { createDecorator } from './ServiceDecorator'
import { Result } from './common/Result'
import { getAbsolutePath } from '@/../public/Utility'
import { IPCRendererResponse } from '@/../public/IPCMessage'
import { ViewType } from '@/../public/ExtensionHostType'
import { ExtensionModule } from './api/ExtensionRequire'
import { logger } from '@/../public/Logger'
const fs = require('fs')

export interface ExtensionAccessor {
  visit(extension: ExtensionService): void;
  result(): any;
}


export enum ExtensionActiveType {
  ExtContentType = 0, //
  ExtView,       //
  ExtExport
}
interface ITest {
  _name: string;
}

const ViewTypeTable = {
  Navigation: ViewType.Navigation,
  Overview: ViewType.Overview,
  DetailView: ViewType.DetailView,
  Property: ViewType.Property,
  Search: ViewType.Search
}
export class MenuDetail {
  command: string;
  group: string;
  name: string;
}
class ExtensionPackage {
  private _name: string = '';
  private _displayName: string = '';
  private _version: string = '';
  private _engines: string = '';
  private _owner: string = '';
  private _main: string = './main.js';
  private _license?: string;
  private _description?: string;
  private _activeEvents: string[] = [];
  private _viewEvents: ViewType[] = [];
  private _dependency: string|undefined;
  private _menus: Map<string, MenuDetail[]> = new Map<string, MenuDetail[]>();  // 
  // private _dependency: Map<string, string> = new Map<string, string>();

  constructor(dir: string) {
    const pack = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf-8'))
    this._name = pack['name']
    this._displayName = pack['displayName'] || ''
    this._owner = pack['owner']
    this._version = pack['version']
    this._engines = pack['engines']
    this._main = getAbsolutePath(dir + (pack['main'] === undefined? '/main.js': '/' + pack['main']))
    const events = pack['civet']['activeEvents']
    for (let event of events) {
      const map = event.split(':')
      if (map.length !== 2) continue
      if (map[0] === 'onContentType') {
        this._activeEvents = map[1].split(',')
      } else if (map[0] === 'onView') {
        const views = map[1].split(',')
        this._viewEvents = views.map((item: string) => {
          return ViewTypeTable[item]
        })
      } else if (map[0] === 'onSave') {
      }
    }
    // contrib
    const contrib = pack['civet']['contributes']
    if (contrib) {
      // menu
      this._initMenus(contrib['menus'])
    }
    // dependency
    const dependency = pack['civet']['dependency']
    if (dependency !== undefined) {
      for (let name in dependency) {
        // this._dependency[name] = dependency[name]
        this._dependency = name
      }
    }
  }

  private _initMenus(menus: any) {
    if (!menus) return
    for (let context in menus) {
      // const ids = context.split('/')
      const m = menus[context]
      for (let menu of m) {
        let item = new MenuDetail()
        item.command = menu['command']
        item.group = menu['group']
        item.name = menu['name']
        if (!this._menus[context]) this._menus[context] = [item]
        else this._menus[context].push(item)
      }
    }
    console.info(this._name, 'init menus', this._menus)
  }

  get name() { return this._name; }
  get displayName() { return this._displayName; }
  get version() { return this._version; }
  get main() { return this._main; }
  get owner() { return this._owner; }
  get activeTypes() { return this._activeEvents }
  get dependency() { return this._dependency }
  get viewEvents() { return this._viewEvents }
  get menus() { return this._menus }
}

const decoratorTest = createDecorator<ITest>('ITest');

export class ExtensionService {
  private _package: ExtensionPackage;
  private _pipe: MessagePipeline;
  private _instance: any = null;
  private _nexts: ExtensionService[] = [];  //dependency service

  constructor(@decoratorTest packagePath: string, pipe: MessagePipeline) {
    this._package = new ExtensionPackage(packagePath)
    this._pipe = pipe
    if (this.hasType(ExtensionActiveType.ExtView)) {
      const result = this._initialize()
      if (result.isSuccess()) { // regist router to renderer
        // this._registRendererRouter()
      }
    }
  }

  get name() {
    return this._package.name
  }

  get dependency() {
    return this._package.dependency
  }

  get displayName() {
    return this._package.displayName
  }

  get menus() {
    return this._package.menus
  }

  addDependency(service: ExtensionService) {
    this._nexts.push(service)
  }

  activeType(): string[] {
    return this._package.activeTypes
  }

  viewType(): ViewType[] {
    return this._package.viewEvents
  }

  type(): ExtensionActiveType[] {
    let types = this._package.activeTypes.keys()
    let t: ExtensionActiveType[] = []
    for (let tp of types) {
      t.push(tp)
    }
    return t
  }

  hasType(type: ExtensionActiveType) {
    switch(type) {
      case ExtensionActiveType.ExtContentType:
        return this._package.activeTypes.length > 0
      case ExtensionActiveType.ExtView:
        return this._package.viewEvents.length > 0
      default:
        return false
    }
  }

  accept(accessor: ExtensionAccessor) {
    accessor.visit(this)
  }

  private _initialize(): Result<string, string> {
    const entryPath = this._package.main
    if (!fs.existsSync(entryPath)) return Result.failure(`file not exist: ${entryPath}`)
    const content = fs.readFileSync(entryPath, 'utf-8')
    const m = new ExtensionModule(this._package.name, module.parent, this._pipe)
    m._compile(content, this._package.name)
    logger.debug(`${m.exports}`)
    try {
      // m.exports.run()
      if (m.exports.activate) {
        this._instance = m.exports.activate()
      }
      if (!this._instance) return Result.failure(`${this._package.name}'s activate is not defined.`)
      return Result.success('ok')
    } catch (error) {
      const msg = `initialize ${this._package.name} fail: ${error}`
      this._pipe!.post(IPCRendererResponse.ON_ERROR_MESSAGE, {msg: msg})
      return Result.failure(msg)
    }
  }

  async run(command: string, ...args: any[]): Promise<Result<string, string>> {
    if (this._instance === null) {
      const result = this._initialize()
      if(!result.isSuccess()) return result
    }
    let cmd = this._instance[command]
    if (!cmd) return Result.failure(`${command} function not exist`)
    try {
      const result = await cmd(...args)
      // this._pipe.post(ReplyType.WORKER_UPDATE_RESOURCES, [file])
      if (result === undefined) {
        return Result.failure(`extension[${this.name}] command[${command}] return ${result}`)
      }
      for (let service of this._nexts) {
        console.info('run next extension', service.name)
        await service.run(command, ...args)
      }
      return Result.success(`${command} success`)
    } catch (err: any) {
      switch(command) {
        case 'read':
          console.error('read error:', err)
          this._pipe!.post(IPCRendererResponse.ON_ERROR_MESSAGE, [{filname: args[0], path: args[0], msg: err.message}])
          break
        default:
          break
      }
      return Result.failure(`run command ${command} fail in ${args}`)
    }
  }
}
