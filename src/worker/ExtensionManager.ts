import fs from 'fs'
import path from 'path'
import { ExtensionActiveType, ExtensionService } from './ExtensionService'
import { MessagePipeline } from './MessageTransfer'
import { civet } from '@/../public/civet'
import { ResourcePath } from './common/ResourcePath'
import { Result } from './common/Result'
import { config } from '@/../public/CivetConfig'
import { APIFactory } from './ExtensionAPI'
import { isFileExist, runCommand } from '@/../public/Utility'
import { CivetDatabase } from './Kernel'
// const loader = require('./Loader')

// loader.config({})

export class ExtensionManager {
  private _pipeline: MessagePipeline;
  private _extensionsOfConfig: string[] = [];
  private _extensions: ExtensionService[] = []; //
  private _actives: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();  // <event, service chain>

  constructor(pipeline: MessagePipeline) {
    this._pipeline = pipeline
    const dbname = config.getCurrentDB()
    const resource = config.getResourceByName(dbname!)
    this._extensionsOfConfig = resource['extensions']||[]

    let extensionPath = path.resolve('.') + '/extensions'
    if (!fs.existsSync(extensionPath)) return
    let exts = fs.readdirSync(extensionPath)
    // remove files
    for (let idx = exts.length - 1; idx >= 0; --idx) {
      if (fs.statSync(extensionPath + '/' + exts[idx]).isDirectory()) continue
      exts.splice(idx, 1)
    }
    this._initServices(extensionPath, exts, pipeline)
    this._buildGraph()
    console.info('graph:', this._actives)
    // npm extension
    // this._extensionPath = (process.env.NODE_ENV !== 'development'?'./resources/app.asar.unpacked':'./build/win-unpacked/resources/app.asar.unpacked')
    this._initExternalExtension()
    pipeline.regist('install', this.install, this)
    pipeline.regist('uninstall', this.uninstall, this)
    pipeline.regist('update', this.update, this)
    // set extension node_modules path
    // const Module = require('module');
    // let originModulePath = Module._nodeModulePaths;
    // console.info('222', Module.paths, ', ', originModulePath)
    // Module._nodeModulePaths = function (from: string) {
    //   let paths = originModulePath.call(this, from)
    //   paths.unshift(...Module.paths)
    //   console.info('node paths:', paths)
    //   return paths
    // }
  }

  private _initServices(root: string, extensionsName: string[], pipeline: MessagePipeline) {
    if (this._extensionsOfConfig.length === 0) {
      this._initRestService(root, extensionsName, pipeline)
    } else {
      let visited = {}
      for (let name of this._extensionsOfConfig) {
        this._initService(root, name, pipeline)
        visited[name]=name
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
    if (!service) {
      const packPath = root + '/' + extensionName
      service = new ExtensionService(packPath, pipeline)
      this._extensions.push(service)
      console.info('extension name:', extensionName)
      return true
    }
    return false
  }

  private _buildGraph() {
    this._actives.clear()
    console.info('service:', this._extensions)
    let extServs: ExtensionService[] = this._extensions
    console.info('service:', extServs)
    // build dependent service
    for (let idx = 0, len = extServs.length; idx < len; ++idx) {
      let service = extServs[idx]
      if (!service.dependency) continue
      for (let pos = 0; pos < len; ++ pos) {
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
        let activeType = service.activeType(ExtensionActiveType.ExtContentType)
        if (!activeType) continue
        for (let active of activeType) {
          let events = this._actives.get(active)
          if (!events) {
            events = []
          }
          events.push(service)
          this._actives.set(active, events)
          // extServs.splice(idx, 1)
        }
      }
    }
  }

  private _getService(name: string) {
    for (let service of this._extensions) {
      if (service.name === name) return service
    }
    return null
  }
  _initExternalExtension() {
    // const extConfig = this._extensionPath + '/package.json'
    // if (isFileExist(extConfig)) {
    //   const pkg = fs.readFileSync(extConfig)
    //   const exts = pkg['dependencies']
    //   for (let ext of exts) {
        
    //   }
    // }
  }

  install(msgid: number, extname: string) {
    // use npm install
    // if (runCommand('npm install ' + extname, this._extensionPath)) {
    // }
    let extPackPath = path.resolve('.') + '/extensions/' + extname + '/package.json'
    if (!isFileExist(extPackPath)) return
  }

  uninstall(msgid: number, extname: string) {
    let extPackPath = path.resolve('.') + '/extensions/' + extname + '/package.json'
    if (!isFileExist(extPackPath)) return
  }

  update(msgid: number, extname: string) {
    let extPackPath = path.resolve('.') + '/extensions/' + extname + '/package.json'
    if (!isFileExist(extPackPath)) return
  }

  switchResourceDB(dbname: string) {
    const resource = config.getResourceByName(dbname)
    this._extensionsOfConfig = resource['extensions']
  }

  async read(uri: ResourcePath): Promise<Result<civet.IResource, string>> {
    const f = path.parse(uri.local())
    const extname = f.ext.substr(1)
    const extensions = this._actives.get(extname)
    if (!extensions || extensions.length === 0) return Result.failure('empty extensions')
    console.info('extensions:', extensions)
    let resource: civet.IResource = APIFactory.createResource(this._pipeline);
    resource.filename = f.base
    resource.path = uri.local()
    if (uri.remote()) {
      resource.remote = uri.remote()
    }
    resource.filetype = extname
    resource.meta.push({name: 'type', value: extname, type: 'str'})
    resource.meta.push({name: 'filename', value: f.base, type: 'str'})
    resource.meta.push({name: 'path', value: uri.local(), type: 'str'})
    for (const extension of extensions) {
      await extension.run('read', uri.local(), resource)
    }
    return Result.success(resource)
  }
  // run() {
    // for (const extension of this.extensions) {
    //   try {
    //     extension()
    //   } catch (err) {
    //     console.error(`run extension ${extension.name} error: ${err}`)
    //   }
    // }
  // }
}
