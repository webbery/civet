import { Resource } from '@/../public/Resource'
import { MessagePipeline } from './MessageTransfer'
import { thumbnail2Base64 } from '@/../public/Utility'
import { CivetDatabase } from './Kernel'

export class APIFactory {
  constructor() {}

  static createResource(pipeline: MessagePipeline): any {
    let resource = new Resource(undefined)
    resource.id = CivetDatabase.generateFilesID(1)[0]
    const handler = {
      set(target: any, key: any, value: any) {
        console.info('proxy set', key)
        switch(key) {
          case 'filename':
            break;
          case 'color':
            // CivetDatabase.addFiles([target.toJson()])
            // console.info('save color meta', target.id, value)
            // CivetDatabase.addMeta([target.id], {name: key, value: value, type: 'color', query: true})
            break
          case 'tag':
            // CivetDatabase.setTags([target.id], target.tag)
            break
          case 'thumbnail':
            {
              if (value === null) {
                return Reflect.set(target, key, value)
              }
              const thumbnail = thumbnail2Base64(value)
              const result = Reflect.set(target, key, thumbnail)
              // const data = target.toJson(_accessor)
              // pipeline.post(ReplyType.WORKER_UPDATE_RESOURCES, data)
              return result
            }
          default:
            {
              // console.debug('update resource property', target, key, value)
              // const data = target.toJson(_accessor)
              // pipeline.post(ReplyType.WORKER_UPDATE_RESOURCES, data)
            }
            break;
        }
        return Reflect.set(target, key, value)
      }
    }
    let proxy = new Proxy(resource, handler)
    return proxy
  }

}

export function defineAPI(factory: APIFactory) {
  // const node_module = <any>require.__$__nodeRequire('module');
}
