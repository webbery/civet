import { ViewType } from '@/../public/ExtensionHostType'
import { getAbsolutePath } from '@/../public/Utility'
const fs = require('fs')

export class MenuDetail {
  command: string;
  group: string;
  name: string;
}

const ViewTypeTable = {
  Navigation: ViewType.Navigation,
  Overview: ViewType.Overview,
  ContentView: ViewType.ContentView,
  Property: ViewType.Property,
  Search: ViewType.Search
}

export abstract class BaseExtension {
  #name: string = '';
  #instance: any = null;

  get name() { return this.#name; }
  set name(n: string) { this.#name = n; }

  get instance() { return this.#instance; }
  set instance(i: any) { this.#instance = i; }
}

export class ExtensionPackage extends BaseExtension {
  private _displayName: string = '';
  private _version: string = '';
  private _engines: string = '';
  private _owner: string = '';
  private _main: string = './main.js';
  private _license?: string;
  private _description?: string;
  private _activeEvents: string[] = [];
  private _viewEvents: ViewType[] = [];
  private _dependency: string|undefined;
  private _menus: Map<string, MenuDetail[]> = new Map<string, MenuDetail[]>();  // 
  // private _dependency: Map<string, string> = new Map<string, string>();

  constructor(dir: string) {
    super()
    const pack = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf-8'))
    super.name = pack['name']
    this._displayName = pack['displayName'] || ''
    this._owner = pack['owner']
    this._version = pack['version']
    this._engines = pack['engines']
    this._main = getAbsolutePath(dir + (pack['main'] === undefined? '/main.js': '/' + pack['main']))
    const events = pack['civet']['activeEvents']
    for (let event of events) {
      const map: string[] = event.split(':')
      if (map.length !== 2) continue
      const str = map[1].trim()
      if (map[0] === 'onContentType') {
        this._activeEvents = str.split(',')
        // console.debug('support content type:', this._activeEvents)
      } else if (map[0] === 'onView') {
        const views = str.split(',')
        this._viewEvents = views.map((item: string) => {
          return ViewTypeTable[item]
        })
      } else if (map[0] === 'onSave') {
      }
    }
    // contrib
    const contrib = pack['civet']['contributes']
    if (contrib) {
      // menu
      this._initMenus(contrib['menus'])
    }
    // dependency
    const dependency = pack['civet']['dependency']
    if (dependency !== undefined) {
      for (let name in dependency) {
        // this._dependency[name] = dependency[name]
        this._dependency = name
      }
    }
  }

  private _initMenus(menus: any) {
    if (!menus) return
    for (let context in menus) {
      // const ids = context.split('/')
      const m = menus[context]
      for (let menu of m) {
        let item = new MenuDetail()
        item.command = menu['command']
        item.group = menu['group']
        item.name = menu['name']
        if (!this._menus[context]) this._menus[context] = [item]
        else this._menus[context].push(item)
      }
    }
    console.info(super.name, 'init menus', this._menus)
  }

  get name() { return super.name; }
  get displayName() { return this._displayName; }
  get version() { return this._version; }
  get main() { return this._main; }
  get owner() { return this._owner; }
  get activeTypes() { return this._activeEvents }
  get dependency() { return this._dependency }
  get viewEvents() { return this._viewEvents }
  get menus() { return this._menus }
}