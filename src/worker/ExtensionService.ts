import {ResourceService} from './ResourceService'
import { config } from '../public/CivetConfig'
import { ResourceLoader } from './service/ResourceLoader'

export class ExtensionService {
  constructor(sock: any, resourceService: ResourceService) {
    this.resourceService = resourceService;
    sock.on('message', function(data: string) {
      const msg = JSON.parse(data)
      console.info(msg)
      switch(msg.id) {
        case 'load':
          console.info('ws load file:', msg.data)
          ExtensionService.resourceLoader.download(msg.data)
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