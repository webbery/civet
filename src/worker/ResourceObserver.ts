import { ExtensionManager } from './ExtensionManager'

export class ResourceObserver {
  private _listener: ExtensionManager;
  constructor(listener: ExtensionManager) {
    this._listener = listener
  }
}

// export function injectObserver<T extends {new(...args:any[]):{}}>(constructor: T) {
//   return class extends constructor{
//     protected observer: ResourceObserver = new ResourceObserver();
//   }
// }