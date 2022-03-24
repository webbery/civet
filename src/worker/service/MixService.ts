import { ResourceProperty } from "civet";
import { ExtensionPackage, MenuDetail } from "worker/ExtensionPackage";
import { BaseService, IAnotationService, IBackgroundService, IStorageService, IViewService } from "./ServiceInterface";

export class MixService extends BaseService implements IBackgroundService, IViewService, IStorageService, IAnotationService{

  constructor(extension: ExtensionPackage) {
    super(extension)
  }
  menus(): Map<string, MenuDetail[]> {
    throw new Error("Method not implemented.");
  }

  onBackgroundEvent(): void {
    throw new Error("Method not implemented.");
  }
  onUpdateEvent(messageId: number, rId: number, data: ResourceProperty[]): void {
    throw new Error("Method not implemented.");
  }
  onRetrieveEvent(): void {
    throw new Error("Method not implemented.");
  }
  onAnnotationUpdateEvent(): void {
    throw new Error("Method not implemented.");
  }
  onSearchEvent(): void {
    throw new Error('Method not implemented.');
  }

}

export function createMixService(derivedCtor: any, baseCtor: any[]) {
  // const names = Object.getOwnPropertyNames(derivedCtor.prototype)
  // for (const name of names) {
  //     if (name === 'constructor') continue
  //     derivedCtor.prototype[name] = undefined
  // }
  for (const base of baseCtor) {
    const props = Object.getOwnPropertyNames(base.prototype)
    for (const prop of props) {
      if (prop === 'constructor') continue
      console.debug('prop name', prop)
      derivedCtor.prototype[prop] = base.prototype[prop]
      console.debug('prop name finish')
    }
  }
}