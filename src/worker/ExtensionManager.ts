import fs from 'fs'
import path from 'path'
import { ExtensionActiveType, ExtensionService } from './ExtensionService'
import { MessagePipeline } from './MessageTransfer'
import { civet } from '@/../public/civet'
import { ResourcePath } from './common/ResourcePath'
import { Result } from './common/Result'
import { config } from '@/../public/CivetConfig'
import { APIFactory } from './ExtensionAPI'
// const loader = require('./Loader')

// loader.config({})

export class ExtensionManager {
  private _pipeline: MessagePipeline;

  constructor(pipeline: MessagePipeline) {
    this._pipeline = pipeline
    const dbname = config.getCurrentDB()
    const resource = config.getResourceByName(dbname!)
    this.extensionsOfConfig = resource['extensions']

    let extensionPath = path.resolve('.') + '/extensions'
    if (!fs.existsSync(extensionPath)) return
    const exts = fs.readdirSync(extensionPath)

    for (let ext of exts) {
      // parse json
      const packPath = extensionPath + '/' + ext
      const info = fs.statSync(packPath)
      if (!info.isDirectory()) continue
      try {
        const service = new ExtensionService(packPath, pipeline)
        const contentTypes = service.activeType(ExtensionActiveType.ExtContentType)
        if (contentTypes === undefined) continue
        for (let contentType of contentTypes) {
          let array: ExtensionService[] = []
          let current = this.extensionsOfContentType.get(contentType)
          if (current !== undefined ) {
            array.push(...current);
          }
          array.push(service)
          this.extensionsOfContentType.set(contentType, array)
        }
      } catch (err) {
        console.error(`load extension ${ext} error: ${err}`)
      }
    }
  }

  switchResourceDB(dbname: string) {
    const resource = config.getResourceByName(dbname)
    this.extensionsOfConfig = resource['extensions']
  }

  read(uri: ResourcePath): civet.IResource|Result<string, string> {
    const extname = path.extname(uri.local()).substr(1)
    const extensions = this.extensionsOfContentType.get(extname)
    if (!extensions || extensions.length === 0) return Result.failure('empty extensions')
    let resource: civet.IResource = APIFactory.createResource(this._pipeline);
    for (const extension of extensions) {
      extension.run('read', uri.local(), resource)
    }
    return resource
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

  private extensionsOfConfig: string[] = [];
  private extensionsOfContentType: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();
  private extensionsOfView: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();
  private extensionsOfExport: Map<string, ExtensionService[]> = new Map<string, ExtensionService[]>();
}
