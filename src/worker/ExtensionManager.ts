import fs from 'fs'
import path from 'path'
import { ExtensionActiveType, ExtensionService } from './ExtensionService'
// const loader = require('./Loader')

// loader.config({})

export class ExtensionManager {
  constructor() {
    let extensionPath = path.resolve('.') + '/extensions'
    const exts = fs.readdirSync(extensionPath)
    console.info(exts)
    for (let ext of exts) {
      // parse json
      const packPath = extensionPath + '/' + ext + '/package.json'
      try {
        const config = JSON.parse(fs.readFileSync(packPath, 'utf-8'))
        if (!config['main']) continue
        const entryPath = extensionPath + '/' + ext + '/' + config['main']
        const script = fs.readFileSync(entryPath, 'utf-8')
        let func = new Function(script)
        func.prototype.name = ext
        // this.extensions.push(func)
        // this.extensions.set(ExtensionActiveType.ExtContentType, new ExtensionService(func))
      } catch (err) {
        console.error(`load extension ${ext} error: ${err}`)
      }
    }
  }

  run() {
    // for (const extension of this.extensions) {
    //   try {
    //     extension()
    //   } catch (err) {
    //     console.error(`run extension ${extension.name} error: ${err}`)
    //   }
    // }
  }

  private extensions: Map<ExtensionActiveType, ExtensionService[]> = new Map<ExtensionActiveType, ExtensionService[]>();
}