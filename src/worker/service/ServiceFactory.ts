import { BaseService } from './ServiceInterface'
import {ExtensionPackage, ExtensionType} from '../ExtensionPackage'
import { ExtensionModule } from '../api/ExtensionRequire'
import {showErrorInfo, getSingleton} from '../Singleton'
import { MessagePipeline } from '../MessageTransfer'
import { BackgroundService } from './BackgroundService'

const fs = require('fs')

export class ServiceFactory {
  static createService(entry: string): BaseService|null {
    const pack = new ExtensionPackage(entry)
    switch(pack.extensionType) {
      case ExtensionType.ViewExtension:
        break
      case ExtensionType.ServiceExtension:
        const instance = this.initialize(pack.name, pack.main)
        if (!instance) return null
        const service = new BackgroundService(pack)
        service.service = instance
        return service
      default: break
    }
    return null
  }

  private static initialize(name: string, entryPath: string): any {
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
        showErrorInfo({msg: msg})
        return null
      }
      return instance
    } catch (error) {
      const msg = `initialize ${name} fail: ${error}`
      showErrorInfo({msg: msg})
      return null
    }
  }
}