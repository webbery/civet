import { Emitter } from 'public/Emitter'
import { getSingleton, showErrorInfo } from 'worker/Singleton';
import { ExtensionPackage, MenuDetail } from 'worker/ExtensionPackage';
import { ExtensionManager } from 'worker/ExtensionManager';
import { IResource, ResourceProperty } from 'civet';
import { Resource } from 'public/Resource';

export abstract class BaseService {
  #event: Emitter;
  #instance: any = null;
  #extension: ExtensionPackage;
  #next: BaseService[] = [];
  #storageEmmiter: boolean = false;

  constructor(extension: ExtensionPackage) {
    this.#event = new Emitter()
    this.#extension = extension
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.#event.on(event, listener)
  }

  emit(event: string, ...args: any[]) {
    return this.#event.emit(event, ...args)
  }

  get service() { return this.#instance; }
  set service(s: any) {
    this.#instance = s;
    // regist event of activate
    for (const name in s) {
      console.info('service name:', name)
      const self = this
      const wrapper = async function (msgid: number, resourceID: number, ...args: any) {
        try{
          const props = await s[name](...args)
          console.debug(self.name, 'nexts:', self.#next)
          for (const service of self.#next) {
            console.debug('emit next:', service.name)
            service.emit(name, msgid, resourceID, ...args)
          }
          // emit to storage service
          if (self.#storageEmmiter && props.length) {
            console.debug(self.name, 'emit storage event')
            const manager = getSingleton(ExtensionManager)
            manager!.emitStorageEvent(msgid, resourceID, props, args[args.length - 1])
          }
        } catch (err: any) {
          showErrorInfo({msg: err})
        }
      }
      this.on(name, wrapper)
    }
  }

  get extension() {return this.#extension; }

  activeType() { return this.#extension.activeTypes; }
  get name() {return this.#extension.name; }
  set storageEmitter(emitter: boolean) {
    this.#storageEmmiter = emitter
  }

  addNext(service: BaseService) {
    this.#next.push(service)
  }
}

export interface IBackgroundService {
    onBackgroundEvent(): void;
}

export interface IStorageService {
    /**
     * when recived an event of update, this implements will be invoked 
     * @param rId resource id
     * @param data update data of resource
     */
    onUpdateEvent(messageId: number, rId: number, data: ResourceProperty[], resource: Resource): void;
    onRetrieveEvent(): void;
    onSearchEvent(): void;
}

export interface IAnotationService {
    onAnnotationUpdateEvent(): void;
}

export interface IViewService {
  menus(): Map<string, MenuDetail[]>;
}