import {ExtensionService} from './ExtensionService'
import {ResourceService} from './ResourceService'
import { MessagePipeline } from './MessageTransfer'

class ServiceHub {
  constructor() {
    const WebSocketServer = require('ws').Server
    this.server = new WebSocketServer({address: 'localhost', port: 21313 })
    const self = this
    this.server.on('connection', function(ws: any) {
      const _self = self
      ws.send('Hello extension');
      _self.extensions.push(new ExtensionService(ws))
    })
    const pipeline = new MessagePipeline(200, new Map())
    this.resourceService = new ResourceService(pipeline);
  }
  registObserver() {}
  private server: any;
  private resourceService: ResourceService;
  private extensions: ExtensionService[] = [];
}

export const serviceHub = new ServiceHub;