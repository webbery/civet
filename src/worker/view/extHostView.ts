import { RPCProtocal } from '../common/RpcProtocal'
import { ViewType } from '@/../public/ExtensionHostType'

export class ExtHostView {
  public proxy: RPCProtocal;

  constructor(rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy;
  }

  update(id: string, type: ViewType, html: string) {
    this.proxy.post(id, type, this.constructor.name, html)
    console.info(`update [${this.constructor.name}]${id}: ${html}`)
  }
}