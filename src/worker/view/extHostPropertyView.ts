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

  update() {
    this.propertyView.updateProperty()
  }
}

export class PropertyView extends ExtHostView{
  #name: string;
  #preview: ArrayBuffer|null|undefined;
  #colorPanel?: ExtHostColorPanel;
  #tag: string[];
  #category?: string[];
  property: any;

  constructor(id: string, rpcProxy: RPCProtocal) {
    super(id, rpcProxy)
    const propArray = new Array<ExtResourceProperty>()
    this.property = propArray
    // const self = this
    // this.property = new Proxy(propArray, {
    //   apply: function(target: any, thisArg: any, argumentsList: any) {
    //     console.info('array :', target)
    //     return thisArg[target].apply(this, argumentsList)
    //   },
    //   deleteProperty: function() {
    //     return true
    //   },
    //   set: function(target, property, value, receiver) {
    //     target[property] = value;
    //     // update 
    //     // if (property !== 'length') {
    //     //   self.update(ViewType.Property, 'properties', value)
    //     // }
    //     return true
    //   }
    // })
  }

  get name(): string {
    return this.#name;
  }
  set name(val: string) {
    this.#name = val
  }

  set preview(val: ArrayBuffer|null|undefined) {
    this.#preview = val
  }

  get preview() {
    return this.#preview
  }

  get tag() {
    return this.#tag
  }

  set tag(val: string[]) {
    this.#tag = val
  }

  set category(val: string[]) {
    this.#category = val
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

  updateProperty() {
    this.update(ViewType.Property, {
      name: this.#name,
      preview: this.#preview,
      tag: this.#tag,
      color: this.#colorPanel? this.#colorPanel.color: undefined,
      category: this.#category,
      properties: this.property
    })
  }
}