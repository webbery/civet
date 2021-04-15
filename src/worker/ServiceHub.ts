import {ExtensionService} from './ExtensionService'
import { RendererMock } from './RendererMock'
import {ResourceService} from './ResourceService'
import { MessagePipeline } from './MessageTransfer'

class ServiceHub {
  constructor() {
    const pipeline = new MessagePipeline(200, new Map())
    this.resourceService = new ResourceService(pipeline);
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
  private extensions: ExtensionService[] = [];
}

export const serviceHub = new ServiceHub;