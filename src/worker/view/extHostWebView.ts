import { ViewType } from '@/../public/ExtensionHostType'
import { RPCProtocal } from '../common/RpcProtocal'
export class ExtHostWebView {
  #html: string = '';
  public proxy: RPCProtocal;
  private _id: string;

  constructor(id: string, rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy;
    this._id = id;
  }
  set html(val: string) {
    this.#html = val
  }

  get html() {
    return this.#html
  }

  postMessage() {}

  update(type: ViewType, html: string) {
    this.proxy.post(this._id, type, this.constructor.name, html)
    console.info(`update [${this.constructor.name}]${this._id}: ${html}`)
  }
}