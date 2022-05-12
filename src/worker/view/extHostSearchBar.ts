import { ViewType } from '@/../public/ExtensionHostType'
import * as civet from 'civet';
import { RPCProtocal } from '../common/RpcProtocal'
import { injectable } from '../Singleton'
import { IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import { CivetDatabase } from '../Kernel'

interface ISelector {
  beforeQuery(query: string[]): Object | string[] | string |undefined;

  toJSON(): string;

  get keyword(): string;
}

class Selector {
  protected listener: (e: civet.SelectionChangedEvent) => Object | string[] | string | undefined;
  public beforeQuery(query: string[]): Object | string[] | string |undefined {
    if (!query || !this.listener) return query
    let event = {values: query}
    return this.listener(event as civet.SelectionChangedEvent)
  }
}

export class ExtEnumSelector extends Selector implements ISelector {
  options: string[] = [];
  size: number;
  #multiple: boolean;
  #defaultName: string;
  #keyword: string;

  toJSON(): any {
    return {
      type: 'enum',
      keyword: this.#keyword,
      options: this.options,
      name: this.#defaultName,
      multiple: this.#multiple
    }
  }

  constructor(queryWord: string, defaultName: string, multiple: boolean) {
    super()
    this.#keyword = queryWord
    this.#defaultName = defaultName
    this.#multiple = multiple
  }

  addEnumeration(desc: string[]) {
    this.options = this.options.concat(desc)
  }

  onSelectionChanged(listener: (e: civet.SelectionChangedEvent) => Object | string[] | string, thisArg?: any) {
    super.listener = listener.bind(thisArg)
  }

  get keyword() { return this.#keyword }
}

export class ExtColorSelector extends Selector implements ISelector {
  color: string;

  toJSON(): any {
    return {
      type: 'color',
      keyword: this.keyword,
      color: this.color
    }
  }
  onSelectionChanged(listener: (e: civet.SelectionChangedEvent) => Object | string[] | string, thisArg?: any) {
    super.listener = listener.bind(thisArg)
  }
  get keyword() { return 'color' }
}

export class ExtDatetimeSelector extends Selector implements ISelector {
  datetime: number;

  toJSON(): any {
    return {
      type: 'datetime',
      keyword: this.keyword,
      datetime: this.datetime
    }
  }
  onSelectionChanged(listener: (e: civet.SelectionChangedEvent) => Object | string[] | string, thisArg?: any) {
    super.listener = listener.bind(thisArg)
  }
  get keyword() { return 'datetime' }
}

export class ExtRangeSelector extends Selector implements ISelector{
  toJSON(): any {
    return {
      type: 'range',
      keyword: this.keyword
    }
  }
  onSelectionChanged(listener: (e: civet.SelectionChangedEvent) => Object | string[] | string, thisArg?: any) {
    super.listener = listener.bind(thisArg)
  }
  get keyword() { return 'range' }
}

@injectable
export class ExtSearchSelectors {
  #selectors: ISelector[] = [];

  constructor() {}
  createEnumSelector(queryWord: string, defaultName: string, multiple: boolean): ExtEnumSelector {
    return new ExtEnumSelector(queryWord, defaultName, multiple)
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

  toJSON(): any {
    let value = []
    for (const selector of this.#selectors) {
      value.push(selector.toJSON())
    }
    return value
  }

  [Symbol.iterator]() {
    const self = this
    let idx = 0
    return {
      next() {
        if (idx < self.#selectors.length) {
          return {
            value: self.#selectors[idx++],
            done: false
          }
        } else {
          return {
            value: undefined,
            done: true
          }
        }
      }
    }
  }
}

@injectable
export class ExtSearchBarManager {
  #searchBar: Map<string, ExtSearchSelectors>;
  #proxy: RPCProtocal;

  constructor(rpcProxy: RPCProtocal) {
    this.#proxy = rpcProxy;
    this.#searchBar = new Map<string, ExtSearchSelectors>()
    this.#proxy.pipeline.regist(IPCNormalMessage.QUERY_RESOURCES, this.queryFiles, this)
  }

  createEnumSelector(queryWord: string, defaultName: string, multiple: boolean): ExtEnumSelector {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    return searchBar.createEnumSelector(queryWord, defaultName, multiple)
  }
  createDatetimeSelector(): ExtDatetimeSelector {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    return searchBar.createDatetimeSelector()
  }
  createColorSelector(): ExtColorSelector {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    return searchBar.createColorSelector()
  }
  createRangeSelector(): ExtRangeSelector {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    return searchBar.createRangeSelector()
  }
  addSelector(selector: ExtEnumSelector | ExtDatetimeSelector | ExtColorSelector | ExtRangeSelector): boolean {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    searchBar.addSelector(selector)
    return true
  }

  getOrCreateSearchSelectorsEntry(): ExtSearchSelectors {
    const id = 'searchBar'
    if (this.#searchBar.has(id)) return this.#searchBar.get(id)!
    const searchbar =  new ExtSearchSelectors()
    this.#searchBar.set(id, searchbar)
    return searchbar
  }

  initSearchBarFinish() {
    const searchBar = this.getOrCreateSearchSelectorsEntry()
    const pipeline = this.#proxy.pipeline
    pipeline.post(IPCRendererResponse.ON_SEARCH_INIT_COMMAND, [searchBar.toJSON()])
  }

  queryFiles(msgid: number, nsql: any) {
    const selectors = this.getOrCreateSearchSelectorsEntry()
    for (const selector of selectors) {
      const result = selector!.beforeQuery(nsql[selector!.keyword])
      if (result) {
        nsql[selector!.keyword] = result
      }
    }
    console.info('query:', nsql)
    if (Object.keys(nsql).length == 0) {
      nsql['type'] = '*'
    }
    const allFiles = CivetDatabase.query(nsql)
    console.info('reply: ', allFiles)
    return {type: IPCRendererResponse.queryFiles, data: allFiles}
  }
}