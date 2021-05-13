import * as civet from 'civet'

class PropertyPage implements civet.IPropertyPage {
    private _html: string = '';

    get html() { return this._html}
    set html(val: string) {
        this._html = val
    }
}

class NavigationPage implements civet.INavigationPage {
    private _html: string = '';

    get html() { return this._html}
    set html(val: string) {
        this._html = val
    }
}

class OverviewPage implements civet.IOverviewPage {
    private _html: string = '';

    get html() { return this._html}
    set html(val: string) {
        this._html = val
    }
}

class DetailviewPage implements civet.IDetailviewPage {
    private _html: string = '';

    get html() { return this._html}
    set html(val: string) {
        this._html = val
    }
}

export namespace window {
    export function createWebviewPanel(viewtype: civet.ViewType): civet.IWebview {
        switch(viewtype) {
          case civet.ViewType.Property:
            return new PropertyPage();
          case civet.ViewType.Navigation:
            return new NavigationPage();
          case civet.ViewType.Overview:
            return new OverviewPage();
          case civet.ViewType.DetailView:
            return new DetailviewPage();
          default:
            throw new Error('unknow view type')
        }
      }
}
