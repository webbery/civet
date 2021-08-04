import { MessagePipeline } from '../MessageTransfer'
import { ViewType } from '@/../public/ExtensionHostType'
import { injectable } from '../Singleton'

@injectable
export class RPCProtocal {
  private pipeline: MessagePipeline;
  private first: boolean = true;
  // private _instances: Map<string, any> = new Map<string, any>();
  private cache: Array<any> = new Array()

  constructor(pipeline: MessagePipeline) {
    this.pipeline = pipeline
    pipeline.regist('mounted', this.mounted, this)
  }

  private mounted() {
    if (this.first) {
      this.first = false
      for (let item of this.cache) {
        this.pipeline.post(item.id, item.msg)
      }
    }
  }
  // set<T>(proxyId: string, instance: T): any {
  //   const handler = {
  //     set(target: any, key: any, value: any) {
  //       // pipeline.post()
  //       console.info('protocal: ', key, value)
  //       return Reflect.set(target, key, value)
  //     }
  //   }
  //   const proxy = new Proxy(instance, handler)
  //   this._instances.set(proxyId, proxy)
  //   return proxy
  // }

  // get(proxyId: string): any {
  //   return this._instances.get(proxyId)
  // }

  post(id: string, viewType: ViewType, classname: string, msg: string) {
    let sViewType
    switch(viewType) {
      case ViewType.Search:
        sViewType = 'Search'
        break
      case ViewType.Property:
        sViewType = 'Property'
        break
      case ViewType.Overview:
        sViewType = 'Overview'
        break
      case ViewType.Navigation:
        sViewType = 'Navigation'
        break
      case ViewType.DetailView:
        sViewType = 'DetailView'
        break
      default:
        break
    }
    if (this.first) {
      this.cache.push({id: `${sViewType}.${classname}.${id}`, msg: msg})
    } else {
      this.pipeline.post(`${sViewType}.${classname}.${id}`, msg)
    }
  }

}