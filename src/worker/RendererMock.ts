import {ResourceService} from './ResourceService'
import { config } from '../public/CivetConfig'
import { ResourceLoader } from './service/ResourceLoader'
import { ResourcePath } from './common/ResourcePath'

export class RendererMock {
  constructor(sock: any, resourceService: ResourceService) {
    this.resourceService = resourceService;
    sock.on('message', async function(data: string) {
      const msg = JSON.parse(data)
      console.info(msg)
      switch(msg.id) {
        case 'load':
          console.info('ws load file:', msg.data)
          const result = await RendererMock.resourceLoader.download(msg.data)
          if (result.isSuccess()) {
            const resourcePath = new ResourcePath(result.value, msg.data['url'])
            await resourceService.readImages(Date.now(), resourcePath)
          } else {
            console.info('err: ', result.value)
            sock.send({msg: result.value})
            resourceService.error(result.value)
          }
          break
        default:
          break;
      }
    });
    sock.on('close', function() {});
    // send all resources database id to extension
    let allResourcesDB = config.getResourcesName()
    // console.info('all resources:', allResourcesDB)
    const cvsetting = {id: 'config', config: {db: allResourcesDB}}
    sock.send(JSON.stringify(cvsetting))
  }

  registRendererNotify() {}

  private resourceService: ResourceService;
  private static resourceLoader: ResourceLoader = new ResourceLoader();
}