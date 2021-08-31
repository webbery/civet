import { MessagePipeline } from '../MessageTransfer'
import { ViewType } from '@/../public/ExtensionHostType'
import { injectable, registSingletonObject } from '../Singleton'

@injectable
export class RPCProtocal {
  #pipeline: MessagePipeline;
  private first: boolean = true;
  private _instances: Map<string, any> = new Map<string, any>();
  private cache: Array<any> = new Array()

  constructor(pipeline: MessagePipeline) {
    this.#pipeline = pipeline
    pipeline.regist('mounted', this.mounted, this)
  }

  private mounted() {
    if (this.first) {
      this.first = false
      for (let item of this.cache) {
        this.#pipeline.post(item.id, item.msg)
      }
    }
  }
  set<T>(id: string, ctor: { new (...args: Array<any>): T}, ...args: any): any {
    let paramsTypes = Reflect.getMetadata('design:paramtypes', ctor)
    if (paramsTypes === undefined) return undefined
    const params = paramsTypes.map((v: any, i: any) => {
      if (i === 0) return id
      return registSingletonObject(v)
    })
    params
    const proxy = new ctor(...params, ...args)
    this._instances[id] = proxy
    return proxy
  }

  get(id: string): any {
    return this._instances.get(id)
  }

  post(id: string, viewType: ViewType, classname: string, msg: any) {
    const sViewType = this.viewType2String(viewType)
    if (this.first) {
      this.cache.push({id: `${sViewType}.${classname}.${id}`, msg: msg})
    } else {
      this.#pipeline.post(`${sViewType}.${classname}.${id}`, msg)
    }
  }

  get pipeline() { return this.#pipeline }

  post2property(id: string, viewType: ViewType, className: string, propName: string, value: any) {
    const sViewType = this.viewType2String(viewType)
    this.#pipeline.post(`${sViewType}.${className}.${id}.${propName}`, value)
  }

  regist<Event>(event: string, listener: (e: Event) => void, thisArg?: any) {
    const process = function (msgid: number, data: any) {
      console.info(`injectEvent callback: ${msgid}, ${data}`)
      const e = <Event>data;
      listener(e)
    };
    this.#pipeline.regist(event, process)
  }

  on(event: string, func: (id: number, data: any) => void, thisArg?: any) {
    this.#pipeline.regist(event, func, thisArg)
  }

  private viewType2String(viewType: ViewType): string {
    switch(viewType) {
      case ViewType.Search:
        return 'Search'
      case ViewType.Property:
        return 'Property'
      case ViewType.Overview:
        return 'Overview'
      case ViewType.Navigation:
        return 'Navigation'
      case ViewType.DetailView:
        return 'DetailView'
      default:
        return ''
    }
  }
}