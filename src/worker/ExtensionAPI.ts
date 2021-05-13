import { civet } from '@/../public/civet'
import { MessagePipeline } from './MessageTransfer'
import { CivetDatabase } from './Kernel'

export class APIFactory {
  constructor() {}

  static createResource(pipeline: MessagePipeline): any {
    let resource = new civet.IResource(undefined)
    resource.id = CivetDatabase.generateFilesID(1)[0]
    const handler = {
      set(target: any, key: any, value: any) {
        console.info('proxy set', key)
        switch(key) {
          case 'filename':
            break;
          case 'color':
            CivetDatabase.addFiles([target.toJson()])
            console.info('save color meta', target.id, value)
            CivetDatabase.addMeta([target.id], {name: key, value: value, type: 'color', query: true})
            break
          case 'tag':
            CivetDatabase.setTags([target.id], target.tag)
            break
          default:
            break;
        }
        return Reflect.set(target, key, value)
      }
    }
    let proxy = new Proxy(resource, handler)
    return proxy
  }
}
