import { ViewType } from '@/../public/ExtensionHostType'
import { RPCProtocal } from '../common/RpcProtocal'

export class HostHTML {
  html: string;
  script: string[];
  style: string[];
}

export class ExtHostWebView {
  #html: HostHTML;
  public proxy: RPCProtocal;
  private _id: string;

  constructor(id: string, rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy;
    this._id = id;
  }
  setHtml(val: HostHTML) {
    this.#html = val
  }

  getHtml() {
    return this.#html
  }


  postMessage() {}

  update(type: ViewType, html: HostHTML) {
    this.proxy.post(this._id, type, this.constructor.name, html)
    // console.info(`update [${this.constructor.name}]${this._id}`)
  }
}