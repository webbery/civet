import { ExtensionManager } from './ExtensionManager'
import { ResourcePath } from './common/ResourcePath'

export class ResourceObserver {
  private _listener: ExtensionManager;
  constructor(listener: ExtensionManager) {
    this._listener = listener
  }

  switchResourceDB(newdb: string) {
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