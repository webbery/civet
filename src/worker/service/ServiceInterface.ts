import { Emitter } from 'public/Emitter'
import { getSingleton, showErrorInfo } from 'worker/Singleton';
import { ExtensionPackage, KeybindDetail, MenuDetail } from 'worker/ExtensionPackage';
import { ExtensionManager } from 'worker/ExtensionManager';
import { IResource, ResourceProperty } from 'civet';
import { Resource } from 'public/Resource';
import { ExtensionModule } from '../api/ExtensionRequire'

export abstract class BaseService {
  #event: Emitter;
  #instance: any = null;
  #module: ExtensionModule;
  #extension: ExtensionPackage;
  #next: BaseService[] = [];
  #storageEmmiter: boolean = false;
  #isActivate: boolean = false;

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

  get module() { return this.#module; }
  set module(val: ExtensionModule) { this.#module = val }

  activate() {
    if (!this.#module || this.#isActivate || !this.#module.exports.activate) return
    this.#isActivate = true
    this.#instance = this.#module.exports.activate()
    if (!this.#instance) return
    // regist event of activate
    for (const name in this.#instance) {
      console.info('service name:', name)
      const self = this
      const wrapper = async function (msgid: number, resourceID: number, ...args: any) {
        try{
          const props = await self.#instance[name](...args)
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

  deactivate() {
    if (!this.#isActivate || !this.#module.exports.deactivate) return
    this.#isActivate = false
    this.#module.exports.deactivate()
  }
  
  envoke(command: string, ...args: any) {
    if (this.#instance && this.#instance[command]) {
      return this.#instance[command](...args)
    }
    return null
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
  keybinds(): Map<string, KeybindDetail[]>;
}