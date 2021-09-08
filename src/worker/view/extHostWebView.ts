import { ViewType } from '@/../public/ExtensionHostType'
import { RPCProtocal } from '../common/RpcProtocal'
import { Emitter } from 'public/Emitter'

export class HostHTML {
  html: string;
  body: string;
  script: string[];
  style: string[];
}

export class ExtHostWebView {
  #html: HostHTML;
  #event: Emitter;
  public proxy: RPCProtocal;
  private _id: string;

  constructor(id: string, rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy;
    this._id = id;
    this.#event = new Emitter()
  }
  setHtml(val: HostHTML) {
    this.#html = val
  }

  getHtml() {
    return this.#html
  }

  get event() {
    return this.#event
  }

  get id() { return this._id }
  
  update(type: ViewType, html: HostHTML) {
    this.proxy.post(this._id, type, this.constructor.name, html)
    // console.info(`update [${this.constructor.name}]${this._id}`)
  }
}