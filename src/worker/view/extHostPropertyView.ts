import { injectable } from '../Singleton'
import { ExtHostView } from './extHostView'
import { RPCProtocal } from '../common/RpcProtocal'
import { ViewType, ExtResourceProperty } from '@/../public/ExtensionHostType'
import { ExtHostColorPanel } from './extHostColorPanel'

@injectable
export class ExtPropertyView{
  propertyView: PropertyView;

  constructor(id: string, rpcProxy: RPCProtocal) {
    this.propertyView = new PropertyView(id, rpcProxy)
  }
}

export class PropertyView extends ExtHostView{
  #name: string;
  #preview: ArrayBuffer|null|undefined;
  #colorPanel?: ExtHostColorPanel;
  #tags: string[];
  category?: string[];
  property: any;

  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
    const propArray = new Array<ExtResourceProperty>()
    const self = this
    this.property = new Proxy(propArray, {
      apply: function(target: any, thisArg: any, argumentsList: any) {
        console.info('array :', target)
        return thisArg[target].apply(this, argumentsList)
      },
      deleteProperty: function() {
        return true
      },
      set: function(target, property, value, receiver) {
        target[property] = value;
        // update 
        if (property !== 'length') {
          self.update(ViewType.Property, 'properties', value)
        }
        return true
      }
    })
  }

  get name(): string {
    return this.#name;
  }
  set name(val: string) {
    this.#name = val
    this.update(ViewType.Property, 'name', val)
  }

  set preview(val: ArrayBuffer|null|undefined) {
    this.#preview = val
    this.update(ViewType.Property, 'preview', val)
  }

  get preview() {
    return this.#preview
  }

  get tags() {
    return this.#tags
  }

  set tags(val: string[]) {
    this.#tags = val
    this.update(ViewType.Property, 'tags', val)
  }

  get colorPanel() {
    if (!this.#colorPanel) {
      this.#colorPanel = new ExtHostColorPanel(this.id, this.proxy)
    }
    return this.#colorPanel
  }

  set colorPanel(val: ExtHostColorPanel | undefined) {
    this.#colorPanel = val
  }
}