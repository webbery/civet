import { MessagePipeline } from './MessageTransfer'
import { Result } from './common/Result'
import { IPCRendererResponse } from '@/../public/IPCMessage'
import { ViewType } from '@/../public/ExtensionHostType'
import { ExtensionModule } from './api/ExtensionRequire'
import { logger } from '@/../public/Logger'
import { ExtensionPackage, ExtensionType } from './ExtensionPackage'
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


export class ExtensionService {
  private _package: ExtensionPackage;
  private _pipe: MessagePipeline;
  private _instance: any = null;
  private _nexts: ExtensionService[] = [];  //dependency service

  constructor(packagePath: string, pipe: MessagePipeline) {
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

  viewType(): ViewType {
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
        return this._package.viewEvents & ExtensionType.ViewExtension
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
    logger.debug(`initialize ${this._package.name}:${m.exports}`)
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
      if (this.hasType(ExtensionActiveType.ExtView)) return Result.success(`${command} not exist in ${this._package.name}`)
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
        // service.emit(service.name + ':' + command, args)
        await service.run(command, ...args)
      }
      return Result.success(`${command} success`)
    } catch (err: any) {
      switch(command) {
        case 'read':  // read file
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
