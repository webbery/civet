import { ViewType } from '@/../public/ExtensionHostType'
import type * as civet from 'civet';
import { RPCProtocal } from '../common/RpcProtocal'
import { injectable } from '../Singleton'
import { ExtHostView } from './extHostView'

@injectable
export class ExtConditionItem extends ExtHostView implements civet.ConditionItem {
  conditions: Array<string|Date>;

  private _html: string;
  private id: string;
  constructor(id: string, rpcProxy: RPCProtocal) {
    super(rpcProxy)
    this.id = id
    this.conditions = new Array()
  }

  set html(value: string) {
    this._html = value
    this.update(this.id, ViewType.Search, this._html)
  }
  get html(): string {
    return this._html
  }
}

export class SearchBar {
  items: ExtConditionItem[] = [];
}

@injectable
export class ExtSearchBar {
  constructor(rpcProxy: RPCProtocal) {
    this.searchBar = new SearchBar();
    this.proxy = rpcProxy;
  }

  createConditionItemEntry(id: string): ExtConditionItem {
    return new ExtConditionItem(id, this.proxy)
  }

  searchBar: SearchBar;
  proxy: RPCProtocal;
}