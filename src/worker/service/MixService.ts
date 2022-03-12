import { ExtensionPackage } from "worker/ExtensionPackage";
import { BaseService, IAnotationService, IBackgroundService, IStorageService, IViewService, StorageUpdateData } from "./ServiceInterface";

export class MixService extends BaseService implements IBackgroundService, IViewService, IStorageService, IAnotationService{

  constructor(extension: ExtensionPackage) {
    super(extension)
  }

  onBackgroundEvent(): void {
    throw new Error("Method not implemented.");
  }
  onUpdateEvent(messageId: number, rId: string, data: StorageUpdateData[]): void {
    throw new Error("Method not implemented.");
  }
  onRetrieveEvent(): void {
    throw new Error("Method not implemented.");
  }
  onAnnotationUpdateEvent(): void {
    throw new Error("Method not implemented.");
  }

}

export function createMixService(derivedCtor: any, baseCtor: any[]) {
  baseCtor.forEach(father => {
    Object.getOwnPropertyNames(father.prototype).forEach(name => {
      if (!derivedCtor.prototy) {
        console.debug(name, 'undefined')
        return
      }
      console.debug('apply', name)
      derivedCtor.prototy[name] = father.prototype[name]
    })
  })
}