import { RendererMock } from './RendererMock'
import {ResourceService} from './service/ResourceService'
import { MessagePipeline } from './MessageTransfer'
import { ExtensionManager } from './ExtensionManager'
import { ResourceObserver } from './service/ResourceObserver'
import { registSingletonObject } from './Singleton'

class ServiceHub {
  constructor() {
    registSingletonObject(MessagePipeline, 200)
    const manager = registSingletonObject(ExtensionManager)
    registSingletonObject(ResourceObserver, this.mocks)
    this.resourceService = registSingletonObject(ResourceService)
    manager.postStartupCommand()
    manager.activeAllService()
    // this.workbechService = new WorkbenchService(pipeline, this.workbenchObserver);
    const WebSocketServer = require('ws').Server
    this.server = new WebSocketServer({address: 'localhost', port: 21313 })
    const self = this
    this.server.on('connection', function(ws: any) {
      const _self = self
      _self.mocks.push(new RendererMock(ws, _self.resourceService));
    })
  }

  registObserver() {}
  private server: any;
  private resourceService: ResourceService;
  private mocks: RendererMock[] = [];
}

export const serviceHub = new ServiceHub;