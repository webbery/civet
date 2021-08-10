import { RPCProtocal } from '../common/RpcProtocal'
import { ViewType } from '@/../public/ExtensionHostType'

export class ExtHostView {
  public proxy: RPCProtocal;
  private _id: string;

  constructor(id: string, rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy;
    this._id = id;
  }

  get id() { return this._id; }

  update(type: ViewType, property: string, value: any) {
    this.proxy.post2property(this._id, type, this.constructor.name, property, value)
  }
}