import fs from 'fs'
import path from 'path'
import { ReplyType, IMessagePipeline } from './Message'
import { createDecorator } from './ServiceDecorator'
import { Result } from './common/Result'
import { civet } from '@/../public/civet'
import { getAbsolutePath } from '@/../public/Utility'

const Module = require('module');
const original = Module.prototype.require;

Module.prototype.require = function(request: any) {
  if (request !== 'civet') {
    return original.apply(this, arguments);
  }
  return require('./ExtensionAPI');
}

export enum ExtensionActiveType {
  ExtContentType = 0, //
  ExtView,       //
  ExtExport
}
interface ITest {
  _name: string;
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
      } else if (map[0] === 'onSave') {
      }
    }
  }

  get name() { return this._name; }
  get version() { return this._version; }
  get main() { return this._main; }
  get owner() { return this._owner; }
  get activeTypes() { return this._activeEvents }
}

const decoratorTest = createDecorator<ITest>('ITest');

let ITest: ITest;
export class ExtensionService {
  private _package: ExtensionPackage;
  private _pipe: IMessagePipeline;
  private _instance: any = null;

  constructor(@decoratorTest packagePath: string, pipe: IMessagePipeline) {
    this._package = new ExtensionPackage(packagePath)
    this._pipe = pipe
  }

  set() {}

  activeType(activeType: ExtensionActiveType): string[]|undefined {
    return this._package.activeTypes.get(activeType)
  }

  run(command: string, ...args: any[]): Result<string, string> {
    if (this._instance === null) {
      const entryPath = this._package.main
      if (!fs.existsSync(entryPath)) return Result.failure(`file not exist: ${entryPath}`)
      const content = fs.readFileSync(entryPath, 'utf-8')
      const Module = require('module')
      const m = new Module('', module.parent)
      m.filename = this._package.name
      m._compile(content, '')
      this._instance = m.exports.activate()
    }
    let cmd = this._instance[command]
    if (!cmd) return Result.failure(`${command} function not exist`)
    return cmd(...args)
  }
}
