import { BaseService, IStorageService, StorageUpdateData } from './ServiceInterface'
import { ExtensionPackage } from '../ExtensionPackage'
import { CivetDatabase } from '../Kernel'
import { MessagePipeline } from '../MessageTransfer'
import { DisplayProperty } from '@/../public/Resource'
import { CivetProtocol } from 'public/Event'
import { IPCNormalMessage, IPCRendererResponse } from 'public/IPCMessage'

class StorageAccessor {
  constructor() {}
  access(property: StorageUpdateData): DisplayProperty|null {
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

export class StorageService extends BaseService implements IStorageService{
  #pipeline: MessagePipeline;

  constructor(pipeline: MessagePipeline, extension: ExtensionPackage) {
    super(extension)
    this.#pipeline = pipeline
  }

  onUpdateEvent(messageId: number, rId: string, data: StorageUpdateData[]): void {
    if (data.length > 1) {
      const store = this.toJson(data)
      CivetDatabase.addFiles([store])
    } else {
      CivetDatabase.addMeta([parseInt(rId)], { name: data[0].name, value: data[0].value, type: data[0].type })
    }

    let msg = new CivetProtocol()
    msg.type = IPCRendererResponse.ON_RESOURCE_UPDATED //ReplyType.WORKER_UPDATE_RESOURCES
    msg.msg = [data]
    console.info('StorageService::onUpdateEvent', msg.msg)
    msg.tick = 0
    msg.id = messageId
    this.#pipeline.reply(msg)
  }

  onRetrieveEvent(): void {
    throw new Error('Method not implemented.');
  }

  private toJson(data: StorageUpdateData[]) {
    const accessor = new StorageAccessor()
    let serialize = {}
    serialize['meta'] = []
    for (let prop of data) {
      // if (serialize[prop.name]) continue
      const p = accessor.access(prop)
      if (!p) continue
      serialize['meta'].push(p)
    }
    return serialize
  }
}