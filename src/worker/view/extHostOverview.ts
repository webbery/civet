import { injectable } from '../Singleton'
import { ExtHostWebView, HostHTML } from './extHostWebView'
import { RPCProtocal } from '../common/RpcProtocal'
import { CivetDatabase } from '../Kernel'
import importHTML from '../api/HtmlParser'
import { ViewType, ExtOverviewItemLoadEvent, ExtOverviewVisibleRangesChangeEvent } from '@/../public/ExtensionHostType'

@injectable
export class ExtOverview extends ExtHostWebView {
  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
  }

  set html(val: string) {
    const result = importHTML(val)
    let hhtml = new HostHTML()
    hhtml.html = result.body
    hhtml.script = result.scripts
    hhtml.style = result.styles
    console.info('html: ', hhtml)
    super.setHtml(hhtml)
    this.update(ViewType.Overview, super.getHtml())
  }

  get html() { return super.getHtml().html }

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
}