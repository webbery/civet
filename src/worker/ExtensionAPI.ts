import { civet } from '@/../public/civet'
import { MessagePipeline } from './MessageTransfer'

export class APIFactory {
  constructor() {}

  static createResource(pipeline: MessagePipeline): any {
    let resource = new civet.IResource(undefined)
    const handler = {
      set(target: any, key: any, value: any) {
        console.info('proxy set', key, value)
        return Reflect.set(target, key, value)
      }
    }
    let proxy = new Proxy(resource, handler)
    return proxy
  }
}
