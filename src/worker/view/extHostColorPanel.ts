import { injectable } from '../Singleton'
import { ExtHostView } from './extHostView'
import { RPCProtocal } from '../common/RpcProtocal'
import { ViewType } from '@/../public/ExtensionHostType'

@injectable
export class ExtHostColorPanel extends ExtHostView {
  #color: any;

  constructor(id: string, proxy: RPCProtocal) {
    super(id, proxy)
    const self = this
    const colorArray = new Array<string>();
    this.#color = new Proxy(colorArray, {
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
          self.update(ViewType.Property, 'color', value)
        }
        return true
      }
    })
  }

  get color() {
    return this.#color
  }

  set color(val: string[] | undefined) {
    this.#color.splice(0, this.#color.length)
    if (!val) {
      return
    }
    for (let idx = 0, len = val.length; idx < len; ++idx) {
      this.#color.push(val[idx])
    }
  }

  onDidColorClick(): void {}
}
