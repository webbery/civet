import { ConditionStyle } from '@/../public/ExtensionHostType'
import type * as civet from 'civet';
import { RPCProtocal } from '../common/RpcProtocal'

export class ExtConditionItem implements civet.ConditionItem {
  conditions: string[];

  private proxy: RPCProtocal;
  private _html: string;
  constructor(id: string, rpcProxy: RPCProtocal) {
    this.proxy = rpcProxy
  }

  set html(value: string) {
    this._html = value
    this.update()
  }
  get html(): string {
    return this._html
  }

  private update() {
    console.info('update ExtConditionItem:', this._html)
  }
}

export class SearchBar {
  items: ExtConditionItem[] = [];
}

export class ExtSearchBar {
  constructor(rpcProxy: RPCProtocal) {
    this.searchBar = new SearchBar();
    this.#proxy = rpcProxy;
  }

  createConditionItemEntry(id: string): ExtConditionItem {
    return new ExtConditionItem(id, this.#proxy)
  }

  searchBar: SearchBar;
  #proxy: RPCProtocal;
}