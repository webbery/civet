import { ViewType } from '@/../public/ExtensionHostType'
import type * as civet from 'civet';
import { RPCProtocal } from '../common/RpcProtocal'
import { injectable } from '../Singleton'
import { IPCRendererResponse } from '@/../public/IPCMessage'


interface ISelector {
  toJSON(): string;
}

export class ExtEnumSelector implements ISelector {
  options: string[] = [];
  size: number;
  #keyword: string;

  toJSON(): any {
    return {
      keyword: this.#keyword,
      options: this.options
    }
  }

  constructor(queryWord: string) {
    this.#keyword = queryWord
  }

  addEnumeration(desc: string) {
    this.options.push(desc)
  }

  get keyword() { return this.#keyword }
}

export class ExtColorSelector implements ISelector {
  color: string;

  toJSON(): any {
    return {
      keyword: 'color',
      color: this.color
    }
  }
}

export class ExtDatetimeSelector implements ISelector {
  datetime: number;

  toJSON(): any {
    return {
      keyword: 'datetime',
      datetime: this.datetime
    }
  }
}

export class ExtRangeSelector implements ISelector{
  toJSON(): any {
    return {
      keyword: 'range'
    }
  }
}

@injectable
export class ExtSearchBar {
  #selectors: ISelector[] = [];

  constructor() {}
  createEnumSelector(queryWord: string): ExtEnumSelector {
    return new ExtEnumSelector(queryWord)
  }
  createDatetimeSelector(): ExtDatetimeSelector {
    return new ExtDatetimeSelector()
  }
  createColorSelector(): ExtColorSelector {
    return new ExtColorSelector()
  }
  createRangeSelector(): ExtRangeSelector {
    return new ExtRangeSelector()
  }
  addSelector(selector: ExtEnumSelector | ExtDatetimeSelector | ExtColorSelector | ExtRangeSelector): boolean {
    this.#selectors.push(selector)
    return true
  }

  toString(): string {
    let value = []
    for (const selector of this.#selectors) {
      value.push(selector.toJSON())
    }
    return JSON.stringify(value)
  }
}

@injectable
export class ExtSearchBarManager {
  #searchBar: Map<string, ExtSearchBar>;
  #proxy: RPCProtocal;

  constructor(rpcProxy: RPCProtocal) {
    this.#proxy = rpcProxy;
    this.#searchBar = new Map<string, ExtSearchBar>()
  }

  createEnumSelector(queryWord: string): ExtEnumSelector {
    const searchBar = this.createSearchBarEntry()
    return searchBar.createEnumSelector(queryWord)
  }
  createDatetimeSelector(): ExtDatetimeSelector {
    const searchBar = this.createSearchBarEntry()
    return searchBar.createDatetimeSelector()
  }
  createColorSelector(): ExtColorSelector {
    const searchBar = this.createSearchBarEntry()
    return searchBar.createColorSelector()
  }
  createRangeSelector(): ExtRangeSelector {
    const searchBar = this.createSearchBarEntry()
    return searchBar.createRangeSelector()
  }
  addSelector(selector: ExtEnumSelector | ExtDatetimeSelector | ExtColorSelector | ExtRangeSelector): boolean {
    const searchBar = this.createSearchBarEntry()
    searchBar.addSelector(selector)
    return true
  }

  createSearchBarEntry(): ExtSearchBar {
    const id = 'searchBar'
    if (this.#searchBar.has(id)) return this.#searchBar.get(id)!
    const searchbar =  new ExtSearchBar()
    this.#searchBar.set(id, searchbar)
    return searchbar
  }

  initSearchBarFinish() {
    const searchBar = this.createSearchBarEntry()
    const pipeline = this.#proxy.pipeline
    pipeline.post(IPCRendererResponse.ON_SEARCH_INIT_COMMAND, searchBar.toString())
  }

}