import { injectable } from '../Singleton'
import { ExtHostWebView } from './extHostWebView'
import { RPCProtocal } from '../common/RpcProtocal'
import { CivetDatabase } from '../Kernel'
import { ViewType, ExtOverviewItemLoadEvent, ExtOverviewVisibleRangesChangeEvent } from '@/../public/ExtensionHostType'

@injectable
export class ExtOverview extends ExtHostWebView {
  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
  }

  set html(val: string) {
    super.html = val
    this.update(ViewType.Overview, super.html)
  }

  get html() { return super.html }

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