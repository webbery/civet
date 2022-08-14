import {ResourceService} from './service/ResourceService'
import { config } from '../public/CivetConfig'
import { ResourceLoader } from './service/ResourceLoader'
import { ResourcePath } from './common/ResourcePath'
import { logger } from '@/../public/Logger'

export enum ExtensionRequest{
  AddResource = 'addResource',
  GetAllResourceDB = 'getAllDB',
  GetCurrentDB = 'getCurrentDB'
}

export enum ExtensionResponse {
  NotifyDBChanged = 'notifyDBChanged',
  NotifyDownloadError = 'notifyDownloadError',
  NotifyDownloadSuccess = 'notifyDownloadSuccess',
  NotifyConnectError = 'notifyConnectError',
  NotifyAllResourceDB = 'notifyAllResourceDB',
  NotifyCurrentDB = 'notifyCurrentDB',
  NotifyReconnect = 'notifyReconnect'
}

class CivetExtensionResponse {
  private static _id: number = 0;
  #method: ExtensionResponse;
  #params: any;

  constructor(method: ExtensionResponse, params: any) {
    CivetExtensionResponse._id += 1
    this.#method = method
    this.#params = params
  }

  toJson() {
    return {
      id: CivetExtensionResponse._id,
      method: this.#method,
      params: this.#params
    }
  }
}

export class RendererMock {
  private _ws: any;

  constructor(sock: any, resourceService: ResourceService) {
    this.resourceService = resourceService;
    this._ws = sock;
    sock.isAlive = true;
    const self = this
    sock.on('message', async function(data: string) {
      const msg = JSON.parse(data)
      logger.debug('recive browser message:', msg)
      switch(msg.method) {
        case ExtensionRequest.AddResource:
          logger.debug(`ws load file: ${msg.params.name}/${msg.params.url}`)
          const result = await self.resourceLoader.download(msg.params)
          if (result.isSuccess()) {
            logger.debug(`resource remote path: ${result.value}`)
            const resourcePath = new ResourcePath(result.value, msg.params['url'])
            await resourceService.readImages(Date.now(), resourcePath)
            const response = new CivetExtensionResponse(ExtensionResponse.NotifyDownloadSuccess, {url: msg.params.url, location: result.value})
            sock.send(JSON.stringify(response.toJson()))
          } else {
            logger.debug(`err: ${result.value}`)
            const response = new CivetExtensionResponse(ExtensionResponse.NotifyDownloadError, {error: result.value, url: msg.params['url'] || msg.params['name']})
            sock.send(JSON.stringify(response.toJson()))
            resourceService.error(result.value)
          }
          break
        case ExtensionRequest.GetCurrentDB:
          self.notifyCurrentResourceDB()
          break
        case ExtensionRequest.GetAllResourceDB:
          self.notifyAllResourceDB()
          break
        default:
          break;
      }
    });
    sock.on('close', function() {
      sock.isAlive = false;
    });
    this.notifyCurrentResourceDB()
    this.notifyAllResourceDB()
  }

  registRendererNotify() {}

  switchResourceDB(newdb: string) {
    const response = new CivetExtensionResponse(ExtensionResponse.NotifyDBChanged, {value: newdb})
    console.debug('switchResourceDB:', newdb)
    this._ws.send(JSON.stringify(response.toJson()))
  }

  notifyCurrentResourceDB() {
    const currentResourceDB = config.getCurrentDB()
    const response = new CivetExtensionResponse(ExtensionResponse.NotifyCurrentDB, {curdb: currentResourceDB})
    console.debug('notifyCurrentResourceDB:', currentResourceDB)
    this._ws.send(JSON.stringify(response.toJson()))
  }

  notifyAllResourceDB() {
    const allResourcesDB = config.getResourcesName()
    const response = new CivetExtensionResponse(ExtensionResponse.NotifyAllResourceDB, {dbs: allResourcesDB})
    console.debug('notifyAllResourceDB:', allResourcesDB)
    this._ws.send(JSON.stringify(response.toJson()))
  }

  private resourceService: ResourceService;
  public resourceLoader: ResourceLoader = new ResourceLoader();
}