import { RendererMock } from './RendererMock'
import {ResourceService} from './ResourceService'
import { MessagePipeline } from './MessageTransfer'
import { ExtensionManager } from './ExtensionManager'
import { ResourceObserver } from './ResourceObserver'

class ServiceHub {
  constructor() {
    const pipeline = new MessagePipeline(200, new Map())
    this.extensionManager = new ExtensionManager();
    this.resourceObserver = new ResourceObserver(this.extensionManager);
    this.resourceService = new ResourceService(pipeline, this.resourceObserver);
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
  private resourceObserver: ResourceObserver;
  private mocks: RendererMock[] = [];
  private extensionManager: ExtensionManager;
}

export const serviceHub = new ServiceHub;