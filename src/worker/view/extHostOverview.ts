import { injectable } from '../Singleton'
import type * as civet from 'civet';
import { ExtHostWebView, HostHTML } from './extHostWebView'
import { RPCProtocal } from '../common/RpcProtocal'
import { CivetDatabase } from '../Kernel'
import importHTML from '../api/HtmlParser'
import { ViewType, ExtOverviewItemLoadEvent, ExtOverviewVisibleRangesChangeEvent } from '@/../public/ExtensionHostType'
import { IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import crypto from 'crypto'

// @injectable
export class ExtOverview extends ExtHostWebView {
  #hash: string;
  #md5: crypto.Hash;

  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
    this.#md5 = crypto.createHash('md5')
  }

  set html(val: string) {
    console.info('filename:', __filename)
    const hash = this.#md5.update(val).digest('base64')
    if (hash === this.#hash) return
    this.#hash = hash
    const result = importHTML(val)
    let hhtml = new HostHTML()
    hhtml.html = val
    hhtml.body = result.body
    hhtml.script = result.scripts
    hhtml.style = result.styles
    console.info('html: ', hhtml)
    this.setHtml(hhtml)
    this.update(ViewType.Overview, super.getHtml())
  }

  get html() { return super.getHtml().html }

  getStructHTML() { return super.getHtml() }

  onResourcesLoading(listener: (e: ExtOverviewItemLoadEvent) => void, thisArg?: any): void {
    const onResourcesLoadingWrapper = function (msg: {id: number[]}): void {
      const resourcesSnap = CivetDatabase.getFilesSnap(undefined)
      let resourcesIndx = []
      for (let idx = 0, len = resourcesSnap.length; idx < len; ++idx) {
        resourcesIndx.push(resourcesSnap[idx])
      }
      const resources = CivetDatabase.getFilesInfo(resourcesIndx)
      listener.apply(thisArg, resources)
    }
    this.proxy.regist('onResourcesLoading', onResourcesLoadingWrapper, thisArg)
  }

  onDidReceiveMessage(listener: (message: any) => void, thisArg?: any): void {}

  onDidChangeOverviewVisibleRanges(listener: (e: civet.OverviewVisibleRangesChangeEvent) => void, thisArg?: any): void {}
}

@injectable
export class ExtOverviewEntry {
  #proxy: RPCProtocal;
  #overviews: Map<string, ExtOverview>;

  constructor(rpcProxy: RPCProtocal) {
    this.#proxy = rpcProxy;
    this.#overviews = new Map<string, ExtOverview>();
    rpcProxy.on(IPCNormalMessage.RETRIEVE_OVERVIEW, this.onRequestOverview, this)
  }

  createOverviewEntry(id: string, router: string, name: string): ExtOverview{
    const overview = new ExtOverview(id, this.#proxy)
    this.#overviews.set(name, overview)
    return overview
  }

  onRequestOverview(id: number, extname: string): any {
    console.info('request extension html:', extname)
    const overview = this.#overviews.get(extname)
    if (!overview) {
      console.error(`overview extension ${extname} not exist`)
      return
    }
    const html = overview.getStructHTML()
    const pipeline = this.#proxy.pipeline
    pipeline.post(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, html)
  }
}
