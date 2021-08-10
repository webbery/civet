import { ViewType } from '@/../public/ExtensionHostType'
import type * as civet from 'civet';
import { RPCProtocal } from '../common/RpcProtocal'
import { injectable } from '../Singleton'
import { ExtHostWebView } from './extHostWebView'

@injectable
export class ExtConditionItem extends ExtHostWebView implements civet.ConditionItem {
  conditions: Array<string|Date>;

  private _html: string;
  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
    this.conditions = new Array()
  }

  set html(value: string) {
    this._html = value
    this.update(ViewType.Search, this._html)
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