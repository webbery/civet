import { BaseService, IStorageService } from './ServiceInterface'
import { ExtensionPackage } from '../ExtensionPackage'
import { CivetDatabase } from '../Kernel'
import { MessagePipeline } from '../MessageTransfer'
import { DisplayProperty, Resource, SerializeAccessor } from '@/../public/Resource'
import { CivetProtocol } from 'public/Event'
import { IPCNormalMessage, IPCRendererResponse } from 'public/IPCMessage'
import { getSingleton } from 'worker/Singleton'
import { IResource, ResourceProperty } from 'civet'
import { Emitter } from 'public/Emitter'

class StorageAccessor {
  constructor() {}
  access(property: ResourceProperty): DisplayProperty|null {
    switch (property.name) {
      case 'filename': return {name: 'filename', type: property.type, value: property.value, query: false};
      case 'path': return {name: 'path', type: property.type, value: property.value, query: false};
      case 'filetype': return null;
      case 'tag': return null;
      default: break
    }
    return {name: property.name, type: property.type, value: property.value, query: property.query}
  }
}

export class StorageService implements IStorageService{
  #event: Emitter;

  constructor() {
    this.#event = new Emitter()
    this.#event.on('save', this._onUpdate)
  }

  onUpdateEvent(messageId: number, rId: number, data: ResourceProperty[], resource: Resource): void {
    console.debug('onUpdateEvent', rId, data)
    if (data.length > 1) {
      const store = this.toJson(resource)
      CivetDatabase.addFiles([store])
      const thumbnail = resource.getPropertyValue('thumbnail')
      if (thumbnail) {
        CivetDatabase.addMeta([resource.id], { name: 'thumbnail', value: thumbnail, type: 'bin' })
      }
    } else {
      switch(data[0].name) {
        case 'color':
          CivetDatabase.addMeta([rId], { name: data[0].name, value: data[0].value, type: 'color', query: true })
          break
        case 'tag':
          CivetDatabase.setTags([rId], data[0].value)
          break
        default:
          if (data[0].value && data[0].value.length !== 0) {
            CivetDatabase.addMeta([rId], { name: data[0].name, value: data[0].value, type: data[0].type })
          }
          break
      }
    }

    this.#event.emit('save', messageId, resource)
  }

  private _onUpdate(messageId: number, resource: Resource) {
    let msg = new CivetProtocol()
    msg.type = IPCRendererResponse.ON_RESOURCE_UPDATED //ReplyType.WORKER_UPDATE_RESOURCES
    const accessor = new SerializeAccessor()
    msg.msg = [resource.toJson(accessor)]
    console.info('StorageService::onUpdateEvent', msg.msg)
    msg.tick = 0
    msg.id = messageId
    const pipeline = getSingleton(MessagePipeline)
    pipeline!.reply(msg)
  }

  onRetrieveEvent(): void {
    throw new Error('Method not implemented.');
  }

  onSearchEvent(): void {
    throw new Error('Method not implemented.');
  }

  private toJson(resource: Resource) {
    const accessor = new StorageAccessor()
    return resource.toJson(accessor)
    // let serialize = {}
    // serialize['meta'] = []
    // for (let prop of data) {
    //   // if (serialize[prop.name]) continue
    //   const p = accessor.access(prop)
    //   if (!p) continue
    //   serialize['meta'].push(p)
    // }
  }
}