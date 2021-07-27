import { MessagePipeline } from '../MessageTransfer'

export class RPCProtocal {
  private pipeline: MessagePipeline;
  constructor(pipeline: MessagePipeline) {
    this.pipeline = pipeline
  }

  set<T>(proxyId: string, instance: T): any {
    const handler = {
      set(target: any, key: any, value: any) {
        // pipeline.post()
        console.info('protocal: ', key, value)
        return Reflect.set(target, key, value)
      }
    }
    const proxy = new Proxy(instance, handler)
    this._instances.set(proxyId, proxy)
    return proxy
  }

  get(proxyId: string): any {
    return this._instances.get(proxyId)
  }

  post() {
    this.pipeline.post('ui', '')
  }

  private _instances: Map<string, any> = new Map<string, any>();
}