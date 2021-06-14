import { ExtensionManager } from './ExtensionManager'
import { RendererMock } from './RendererMock'
import { ResourcePath } from './common/ResourcePath'

export class ResourceObserver {
  private _listener: ExtensionManager;
  private _browsers: RendererMock[];
  constructor(listener: ExtensionManager, browser: RendererMock[]) {
    this._listener = listener
    this._browsers = browser
  }

  switchResourceDB(newdb: string) {
    for (let browser of this._browsers) {
      browser.switchResourceDB(newdb)
    }
    return this._listener.switchResourceDB(newdb)
  }
  
  read(uri: ResourcePath) {
    return this._listener.read(uri)
  }
}

// export function injectObserver<T extends {new(...args:any[]):{}}>(constructor: T) {
//   return class extends constructor{
//     protected observer: ResourceObserver = new ResourceObserver();
//   }
// }