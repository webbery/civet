import { RendererMock } from './RendererMock'
import {ResourceService} from './service/ResourceService'
import { MessagePipeline } from './MessageTransfer'
import { ExtensionManager } from './ExtensionManager'
import { ResourceObserver } from './service/ResourceObserver'
import { WorkbenchService } from './service/WorkbenchService'
import { WorkbenchObserver } from './service/WorkbenchObserver'

class ServiceHub {
  constructor() {
    const pipeline = new MessagePipeline(200, new Map())
    this.extensionManager = new ExtensionManager(pipeline);
    this.resourceObserver = new ResourceObserver(this.extensionManager, this.mocks);
    this.workbenchObserver = new WorkbenchObserver(pipeline, this.extensionManager);
    this.workbechService = new WorkbenchService(pipeline, this.workbenchObserver);
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
  private workbechService: WorkbenchService;
  private workbenchObserver: WorkbenchObserver;
  private resourceObserver: ResourceObserver;
  private mocks: RendererMock[] = [];
  private extensionManager: ExtensionManager;
}

export const serviceHub = new ServiceHub;