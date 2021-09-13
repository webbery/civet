import { injectable } from '../Singleton'
import type * as civet from 'civet';
import { ExtHostWebView, HostHTML } from './extHostWebView'
import { RPCProtocal } from '../common/RpcProtocal'
import { CivetDatabase } from '../Kernel'
import importHTML from '../api/HtmlParser'
import { ViewType, ExtOverviewItemLoadEvent, ExtOverviewVisibleRangesChangeEvent } from '@/../public/ExtensionHostType'
import { IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import { registHostEvent } from '../Singleton'
import { CivetProtocol } from '@/../public/Event'
import crypto from 'crypto'
import { config } from '@/../public/CivetConfig'

function generateResourcesLoadingEvent(): ExtOverviewItemLoadEvent {
  const resourcesSnap = CivetDatabase.getFilesSnap(undefined)
  let resourcesIndx = []
  let event = new ExtOverviewItemLoadEvent()
  if (resourcesSnap) {
    for (let idx = 0, len = resourcesSnap.length; idx < len; ++idx) {
      resourcesIndx.push(resourcesSnap[idx].id)
    }
    const resources = CivetDatabase.getFilesInfo(resourcesIndx)
    event.resources = resources
  }
  return event
}

// @injectable
export class ExtOverview extends ExtHostWebView {
  #hash: string;
  #updated: boolean;

  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
    this.#updated = false
  }

  set html(val: string) {
    console.info('filename:', __filename)
    const md5 = crypto.createHash('md5')
    const hash = md5.update(val).digest('base64')
    if (hash === this.#hash) return
    this.#updated = false
    this.#hash = hash
    const result = importHTML(val)
    let hhtml = new HostHTML()
    hhtml.html = val
    hhtml.body = result.body
    hhtml.script = result.scripts
    hhtml.style = result.styles
    console.info('html: ', hhtml)
    this.setHtml(hhtml)
    this.update()
  }

  get html() { return super.getHtml().html }

  getStructHTML() { return super.getHtml() }

  update() {
    if (this.id === config.defaultView && !this.#updated) {
      this.#updated = true
      this.proxy.pipeline.post(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, super.getHtml())
    }
  }

  onResourcesLoading(listener: (e: ExtOverviewItemLoadEvent) => void, thisArg?: any): void {
    const onResourcesLoadingWrapper = function (): void {
      let event = generateResourcesLoadingEvent()
      listener.call(thisArg, event)
    }
    this.proxy.pipeline.regist(IPCNormalMessage.REQUEST_UPDATE_RESOURCES, onResourcesLoadingWrapper)
    this.event.on(IPCNormalMessage.REQUEST_UPDATE_RESOURCES, onResourcesLoadingWrapper);
  }

  onDragResources(listener: (e: civet.OverviewItemLoadEvent) => void, thisArg?: any): void {
    // this.event.on()
  }

  onDidReceiveMessage(listener: (message: any) => void, thisArg?: any): void {}

  onDidChangeOverviewVisibleRanges(listener: (e: civet.OverviewVisibleRangesChangeEvent) => void, thisArg?: any): void {}
}

@injectable
export class ExtOverviewEntry {
  #proxy: RPCProtocal;
  #overviews: Map<string, ExtOverview>;
  #activeView: string;

  constructor(rpcProxy: RPCProtocal) {
    this.#proxy = rpcProxy;
    this.#overviews = new Map<string, ExtOverview>();
    this.#activeView = config.defaultView;
    registHostEvent(IPCNormalMessage.ADD_RESOURCES_BY_PATHS, this.onResourcesAdd, this)
    rpcProxy.on(IPCNormalMessage.RETRIEVE_OVERVIEW, this.onRequestOverview, this)
  }

  createOverviewEntry(id: string, router: string): ExtOverview{
    const overview = new ExtOverview(id, this.#proxy)
    this.#overviews.set(id, overview)
    const pipeline = this.#proxy.pipeline
    pipeline.post(IPCRendererResponse.ON_VIEW_ROUTER_ADD, [{name: id, display: router}])
    return overview
  }

  async onRequestOverview(id: number, extname: string) {
    console.info(`onRequestOverview: ${extname}, ${this.#activeView}`)
    if (extname === this.#activeView) return
    const overview = this.#overviews.get(extname)
    if (!overview) {
      console.error(`overview extension ${extname} not exist`)
      return
    }
    const event = overview.event
    if (!await event.emitAsync(IPCNormalMessage.REQUEST_UPDATE_RESOURCES)) return
    this.#activeView = extname
    config.defaultView = extname
    const html = overview.getStructHTML()
    if (!html) {

    }
    console.info('request extension html:', html)
    overview.update()
  }

  onResourcesAdd(id: number, paths: string[]) {
    console.info('onResourcesAdd', paths)
  }
}
