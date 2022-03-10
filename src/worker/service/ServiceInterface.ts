import { Emitter } from 'public/Emitter'
import { PropertyType } from 'public/ExtensionHostType'
import fs from 'fs'

export abstract class BaseService {
  #event: Emitter;
  #instance: any = null;

  constructor() {
    this.#event = new Emitter()
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.#event.on(event, listener, [this, event])
  }

  emit(event: string, ...args: any[]) {
    return this.#event.emit(event, args)
  }

  get service() { return this.#instance; }
  set service(s: any) { this.#instance = s; }
}

export interface IBackgroundService {
    onExtractEvent(): void;
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
    onUpdateEvent(): void;
}