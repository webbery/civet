import { Resource, readThumbnail, SerializeAccessor } from '@/../public/Resource'
import { MessagePipeline } from './MessageTransfer'
import { CivetDatabase } from './Kernel'
import { ReplyType } from './Message'

const _accessor: SerializeAccessor = new SerializeAccessor();
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
            // console.info('type:', typeof value, value)
            // CivetDatabase.addMeta([target.id], {name: key, value: value, type: 'bin'})
            const thumbnail = readThumbnail(value)
            // console.info('thumbnail', target)
            // let property:IProperty;
            // target.addMeta('thumbnail', thumbnail, 'undefined')
            const result = Reflect.set(target, key, thumbnail)
            // console.info('thumbnail', target)
            const data = target.toJson(_accessor)
            // console.info('post data', data)
            pipeline.post(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, data)
            return result
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

export function defineAPI(factory: APIFactory) {
  // const node_module = <any>require.__$__nodeRequire('module');
}
