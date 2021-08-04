import { injectable } from '../Singleton'
import { ExtHostView } from './extHostView'
import { RPCProtocal } from '../common/RpcProtocal'

@injectable
export class ExtPropertyView{
  propertyView: PropertyView;

  constructor(rpcProxy: RPCProtocal) {
    this.propertyView = new PropertyView(rpcProxy)
  }
}

export class PropertyView extends ExtHostView{
  private _name: string;
  private _html: string;

  constructor(rpcProxy: RPCProtocal) {
    super(rpcProxy)
  }

  get name(): string {
    return this._name;
  }
  set name(val: string) {
    this._name = val
  }

  get html(): string {
    return this._html;
  }

  set html(val: string) {
    this._html = val;
  }
}