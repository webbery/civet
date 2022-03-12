import { Emitter } from 'public/Emitter'
import { PropertyType } from 'public/ExtensionHostType'
import fs from 'fs'
import { getSingleton, showErrorInfo } from 'worker/Singleton';
import { ExtensionPackage } from 'worker/ExtensionPackage';
import { ExtensionManager } from 'worker/ExtensionManager';

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
        console.debug(...args)
        try{
          const props = await s[name](...args)
          for (const service of self.#next) {
            // service.emit(service.name, ...args)
          }
          // emit to storage service
          if (self.#storageEmmiter) {
            const manager = getSingleton(ExtensionManager)
            // manager!.emitStorageEvent(msgid, resourceID, props)
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
}

export interface IBackgroundService {
    onBackgroundEvent(): void;
}

export class StorageUpdateData {
  #id: string;
  #name: string;
  #value: any;
  #type: PropertyType;
  #query: boolean;
  #storage: boolean;

  get name() { return this.#name;}
  get value() { return this.#value;}
  get type() { return this.#type;}
  get query() { return this.#query;}
  get storage() { return this.#storage;}
  set name(n: string) { this.#name = n;}
  set value(v: any) { this.#name = v;}
  set type(t: PropertyType) { this.#type = t;}
  set query(q: boolean) { this.#query = q;}
  set storage(s: boolean) { this.#storage = s;}
}

export interface IStorageService {
    /**
     * when recived an event of update, this implements will be invoked 
     * @param rId resource id
     * @param data update data of resource
     */
    onUpdateEvent(messageId: number, rId: string, data: StorageUpdateData[]): void;
    onRetrieveEvent(): void;
}

export interface IAnotationService {
    onAnnotationUpdateEvent(): void;
}

export interface IViewService {

}