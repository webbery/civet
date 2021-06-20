import {ResourceService} from './ResourceService'
import { config } from '../public/CivetConfig'
import { ResourceLoader } from './service/ResourceLoader'
import { ResourcePath } from './common/ResourcePath'
import { logger } from '@/../public/Logger'

const BrowserEvent = {
  EmitDownloadError: 'download',
  EmitInition: 'config',
  EmitSwitchDB: 'dbchange',
  OnLoad: 'load',
};

export class RendererMock {
  private _ws: any;

  constructor(sock: any, resourceService: ResourceService) {
    this.resourceService = resourceService;
    this._ws = sock;
    sock.isAlive = true;
    sock.on('message', async function(data: string) {
      const msg = JSON.parse(data)
      logger.debug(msg)
      switch(msg.id) {
        case BrowserEvent.OnLoad:
          logger.debug(`ws load file: ${JSON.stringify(msg.data)}`)
          const result = await RendererMock.resourceLoader.download(msg.data)
          if (result.isSuccess()) {
            logger.debug(`resource remote path: ${result.value}`)
            const resourcePath = new ResourcePath(result.value, msg.data['url'])
            await resourceService.readImages(Date.now(), resourcePath)
          } else {
            logger.debug(`err: ${result.value}`)
            sock.send(JSON.stringify({id: BrowserEvent.EmitDownloadError, error: result.value, url: msg.data['url']}))
            resourceService.error(result.value)
          }
          break
        default:
          break;
      }
    });
    sock.on('close', function() {
      sock.isAlive = false;
    });
    // send all resources database id to extension
    let allResourcesDB = config.getResourcesName()
    // console.info('all resources:', allResourcesDB)
    const cvsetting = {id: BrowserEvent.EmitInition, config: {db: allResourcesDB}}
    sock.send(JSON.stringify(cvsetting))
  }

  registRendererNotify() {}

  switchResourceDB(newdb: string) {
    this._ws.send(JSON.stringify({id: BrowserEvent.EmitSwitchDB, value: newdb}))
  }

  private resourceService: ResourceService;
  private static resourceLoader: ResourceLoader = new ResourceLoader();
}