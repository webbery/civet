import { injectable, showErrorInfo } from '../Singleton'
import { ExtHostWebView, HostHTML } from './extHostWebView'
import { RPCProtocal } from '../common/RpcProtocal'
import { ExtContentViewLoadEvent } from '@/../public/ExtensionHostType'
import { IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import crypto from 'crypto'
import importHTML from '../api/HtmlParser'

class ExtContentView extends ExtHostWebView {
  #suffix: string[];
  #hash: string;
  #initialize: () => string;

  constructor(id: string, rpcProxy: RPCProtocal, suffixes: string[]) {
    super(id, rpcProxy)
    this.#suffix = suffixes
  }

  get hash() { return this.#hash }

  set html(val: string) {
    const md5 = crypto.createHash('md5')
    this.#hash = md5.update(val).digest('base64')
    const result = importHTML(val)
    let hhtml = new HostHTML()
    hhtml.html = val
    hhtml.body = result.body
    hhtml.script = result.scripts
    hhtml.style = result.styles
    console.info('html: ', hhtml)
    this.setHtml(hhtml)
  }

  onResourceLoading(listener: (e: ExtContentViewLoadEvent) => void, thisArg?: any): void {
    // if (!this.isUpdate()) {
    //   this.updated = true
    //   let response = super.getHtml()
    //   response['id'] = this.id
    //   this.proxy.pipeline.post(IPCRendererResponse.ON_EXTENSION_CONTENT_UPDATE, response)
    // }
  }

  onViewInitialize(listener: () => string): void {
    this.#initialize = listener
  }

  initialize(): HostHTML|undefined {
    if (!this.#initialize) {
      const msg = 'Please reigst ExtContentView::onViewInitialize listener'
      console.error(msg)
      showErrorInfo({msg: msg})
      return undefined
    }
    const html = this.#initialize()
    this.html = html
    return this.getHtml()
  }

  onNextResourceDisplay(): void {}
  onPrevResourceDisplay(): void {}
}

@injectable
export class ExtContentViewEntry {
  #contentviews: Map<string, ExtContentView[]>;
  #proxy: RPCProtocal;

  constructor(rpcProxy: RPCProtocal) {
    this.#proxy = rpcProxy
    this.#contentviews = new Map<string, ExtContentView[]>()
    console.info('ExtContentViewEntry construction')
    this.#proxy.pipeline.regist(IPCNormalMessage.RETRIEVE_CONTENT_VIEW, this.onRetrieveContentView, this)
  }

  createContentViewEntry(id: string, suffixes: string[]): ExtContentView | null {
    console.info('createContentViewEntry', this)
    const view = this.getContentViewByID(id, suffixes)
    if (view) return view
    if (suffixes.length === 0) return null
    console.debug('create new content view:', id, suffixes)
    const contentView = new ExtContentView(id, this.#proxy, suffixes)
    for (let suffix of suffixes) {
      let views: ExtContentView[] = this.#contentviews[suffix] || []
      views.push(contentView)
      this.#contentviews.set(suffix, views)
    }
    return contentView
  }

  getContentViews(suffix: string): ExtContentView[] {
    return this.#contentviews.get(suffix) || []
  }

  private getContentViewByID(id: string, suffixes: string[]): ExtContentView | null {
    for (let suffix of suffixes) {
      if (this.#contentviews.has(suffix)) {
        const views = this.getContentViews(suffix)
        for (let view of views) {
          if (view.id === id) return view
        }
      }
    }
    return null
  }

  private onRetrieveContentView(id: number, suffix: string) {
    const views = this.getContentViews(suffix)
    console.debug(`onRetrieveContentView ${suffix}[${views.length}]`)
    switch(views.length) {
      case 0:
        const msg = `content view of ${suffix} is not install`
        console.error('current:', this.#contentviews)
        showErrorInfo({msg: msg})
        break
      case 1:
        const view = views[0]
        let html = view.getHtml() || view.initialize()
        html['id'] = view.id
        this.#proxy.pipeline.post(IPCRendererResponse.ON_EXTENSION_CONTENT_UPDATE, html)
      default:
        break
    }
  }
}
