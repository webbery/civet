import { ReplyType, IMessagePipeline, ErrorMessage } from './Message'
import { MessagePipeline } from './MessageTransfer'
import { createDecorator } from './ServiceDecorator'
import { Result } from './common/Result'
import { getAbsolutePath } from '@/../public/Utility'
import { ViewType } from '@/../public/ExtensionHostType'
import { ExtensionModule } from './api/ExtensionRequire'
const fs = require('fs')

// const Module = require('module');
// const original = Module.prototype.require;

// Module.prototype.require = function(request: string) {
//   if (request !== 'civet') {
//     return original.apply(this, arguments);
//   }
//   return require('./ExtensionAPI');
// }

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
  SearchBar: ViewType.Search
}
class ExtensionPackage {
  private _name: string = '';
  private _version: string = '';
  private _engines: string = '';
  private _owner: string = '';
  private _main: string = './main.js';
  private _license?: string;
  private _description?: string;
  private _activeEvents: Map<ExtensionActiveType, string[]> = new Map<ExtensionActiveType, string[]>();
  private _dependency: string|undefined;
  // private _dependency: Map<string, string> = new Map<string, string>();

  constructor(dir: string) {
    const pack = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf-8'))
    this._name = pack['name']
    this._owner = pack['owner']
    this._version = pack['version']
    this._engines = pack['engines']
    this._main = getAbsolutePath(dir + (pack['main'] === undefined? '/main.js': '/' + pack['main']))
    const events = pack['civet']['activeEvents']
    for (let event of events) {
      const map = event.split(':')
      if (map.length !== 2) continue
      if (map[0] === 'onContentType') {
        const contentTypes = map[1].split(',')
        let array: string[] = []
        let temp = this._activeEvents.get(ExtensionActiveType.ExtContentType);
        if (temp !== undefined) {
          array.push.apply(array, temp)
        }
        array.push.apply(array, contentTypes)
        this._activeEvents.set(ExtensionActiveType.ExtContentType, array)
      } else if (map[0] === 'onView') {
        const vt = ViewTypeTable[map[1]]
        if (vt !== undefined) {
          this._activeEvents.set(ExtensionActiveType.ExtView, vt);
        } else {
          console.error(`[package.json]${dir}: ${map[1]} is not in ViewType`)
        }
      } else if (map[0] === 'onSave') {
      }
    }
    const dependency = pack['civet']['dependency']
    if (dependency !== undefined) {
      for (let name in dependency) {
        // this._dependency[name] = dependency[name]
        this._dependency = name
      }
    }
  }

  get name() { return this._name; }
  get version() { return this._version; }
  get main() { return this._main; }
  get owner() { return this._owner; }
  get activeTypes() { return this._activeEvents }
  get dependency() { return this._dependency }
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
      this._initialize()
    }
  }

  get name() {
    return this._package.name
  }

  get dependency() {
    return this._package.dependency
  }

  addDependency(service: ExtensionService) {
    this._nexts.push(service)
  }

  activeType(activeType: ExtensionActiveType): string[]|undefined {
    return this._package.activeTypes.get(activeType)
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
    return this._package.activeTypes.has(type)
  }

  private _initialize(): Result<string, string> {
    const entryPath = this._package.main
    if (!fs.existsSync(entryPath)) return Result.failure(`file not exist: ${entryPath}`)
    const content = fs.readFileSync(entryPath, 'utf-8')
    const m = new ExtensionModule('', module.parent, this._pipe)
    m._compile(content, this._package.name)
    console.info(m.exports)
    try {
      // m.exports.run()
      if (m.exports.activate) {
        this._instance = m.exports.activate()
      }
      return Result.success('ok')
    } catch (error) {
      const msg = `initialize ${this._package.name} fail: ${error}`
      this._pipe!.post('onErrorMessage', {msg: msg})
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
      // this._pipe.post(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file])
      if (result === undefined) {
        return Result.failure(`extension[${this.name}] command[${command}] return ${result}`)
      }
      for (let service of this._nexts) {
        console.info('run next extension', service.name)
        await service.run(command, ...args)
      }
      return Result.success(`${command} success`)
    } catch (err) {
      switch(command) {
        case 'read':
          console.error('read error:', err)
          this._pipe!.post(`onCommandFail ${command}`, [{filname: args[0], path: args[0], msg: err.message}])
          break
        default:
          break
      }
      return Result.failure(`run command ${command} fail in ${args}`)
    }
  }
}
