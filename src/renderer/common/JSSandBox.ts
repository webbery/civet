import { patchAppendChild } from './StyleSandBox'
// import { patchDocumentCreateElement } from './DOMHook'
import { hasProtocol } from '@/../public/Utility'

declare const __static: string;

enum ElementType {
  Head,
  Body
}

type SandboxConfig = {
  name: string;
  type: ElementType;
  proxy: WindowProxy;
}

function runScript(script: string, proxy: Window) {
  const globalWindow = (0, eval)('window')
	globalWindow.proxy = proxy
  const code = `;(function(window, self, globalThis){;${script}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);` as string
  (0, eval)(code)
}

async function fetchScript(url: string) {
  const response = await fetch(url, {
    mode: 'cors'
  })
  let script = ''
  if (response.ok && response.status === 200) {
    const reader = response.body?.getReader()
    let stream = await reader!.read()
    while(!stream.done) {
      script += new TextDecoder().decode(stream.value)
      stream = await reader!.read()
    }
  }
  return script
}

function isURL(str: string) {
  const URLRegex = /^http(s){0,1}:[\w\W/.]+/ig
  return URLRegex.test(str)
}

export class JSSandBox {
  #proxy: any;
  #name: string;
  #acitvate: boolean = false;
  #propertiesWithGetter: Map<string|symbol, boolean> = new Map();
  /**
   * @brief this sand box properties
   *        when sand box activate, these properties should be updated
   *        when sand box inactivate, it should be stored.
   */
  #properties: Map<string, any>;
  #elements: WeakMap<HTMLElement, SandboxConfig>;
  /**
   * @brief the scripts of this sand box. Save as [name/url, scriptText]
   */
  #scriptCache: Map<string, string>;

  constructor(name: string) {
    this.#name = name
    this.#properties = new Map()
    this.#elements = new WeakMap()
    this.#scriptCache = new Map()
    const fakeWindow = this._createFakeWindow()
    const hasOwnProperty = (key: string) => {
      fakeWindow.hasOwnProperty(key) || SandBoxManager.rawWindow.hasOwnProperty(key)
    }

    // this.#proxy = new Proxy(fakeWindow, {
    //   set: (target, prop, receiver) => {
    //     // console.debug('sandbox set:', prop, receiver)
    //     if (this.#acitvate) {
    //       target[prop] = receiver
    //       return true
    //     }
    //     // console.debug('window set:', prop, receiver)
    //     window[prop] = receiver
    //     return true
    //   },
    //   get: (target, prop) => {
    //     if (prop === Symbol.unscopables) return Symbol.unscopables
    //     // console.debug('sandbox get:', prop)
    //     if (prop === 'window' || prop === 'self' || prop === 'globalThis') {
    //       return this.#proxy
    //     }
    //     if (prop === 'top' || prop === 'parent') {
    //       if (SandBoxManager.rawWindow === SandBoxManager.rawWindow.parent) {
    //         return this.#proxy
    //       }
    //       return SandBoxManager.rawWindow[prop]
    //     }
    //     if (prop === 'hasOwnProperty') {
    //       return hasOwnProperty
    //     }
    //     const value = this.#propertiesWithGetter.has(prop) ? 
    //       SandBoxManager.rawWindow[prop] : 
    //       (prop in target ? target[prop] : SandBoxManager.rawWindow[prop]);
    //     // console.info('target', prop, target, value)
    //     return value
    //   }
    // })
    this.#proxy = window
  }

  name() {return this.#name}
  get proxy() {return this.#proxy}

  inactivate() {
    this.#acitvate = false
    console.debug('inactivate prop:', this.#properties.size)
    // delete properties of window
    for (let prop in this.#properties) {
      this._updateProperties(prop, this.#properties[prop], true)
    }
    // 
  }

  activate() {
    this.#acitvate = true
    console.debug('activate prop:', this.#properties)
    // attach properties to window
    for (let prop in this.#properties) {
      this._updateProperties(prop, this.#properties[prop])
    }
  }

  private _updateProperties(prop: string, value: any, delFlag: boolean = false) {
    // console.debug('11111', Window.name, value.constructor.name, value instanceof window.Window)
    if (Window.name === value.constructor.name) return
    if (!value || delFlag) {
      console.debug('delete prop:', prop)
      delete this.#proxy[prop]
    } else {
      console.debug('restore prop:', prop, value)
      this.#proxy[prop] = value
    }
  }

  setElement(element: HTMLElement) {}

  async initializeScript(scripts: string[]) {
    console.info('initializeScript')
    try {
      for (const script of scripts) {
        let realScript = script
        if (isURL(script)) {
          realScript = await fetchScript(script)
        }
        runScript(realScript, this.#proxy)
      }
    } catch(err: any) {
      console.error(`run script fail: ${err}`)
      for (const script of scripts) {
        let s = document.createElement('script')
        if (isURL(script)) {
          // 挂载到script节点
          await new Promise((resolve, reject) => {
            s.onload = function() {
              console.info('complete')
              resolve(true)
            }
            s.onerror = function(oError) {
              // const err = 'The script ' + oError.target.src + ' is not accessible.'
              // events.emit('civet', 'onErrorMessage', {msg: err})
              reject(oError)
            }
            s.async = true
            if (hasProtocol(script)) {
              s.src = script
            } else {
              s.src = require('path').join(__static, '/' + script)
            }
            s.type = 'module'
            console.info('src script:', s.src)
            document.head.appendChild(s)
          })
        } else {
          runScript(script, this.#proxy)
          // s.innerHTML = script
          // document.body.appendChild(s)
        }
      }
    }
  }

  private _createFakeWindow() {
    const fakeWindow = Object.create({})
    Object.getOwnPropertyNames(SandBoxManager.rawWindow).filter(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(SandBoxManager.rawWindow, prop)
      return !descriptor?.configurable
    }).forEach(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(SandBoxManager.rawWindow, prop)
      if (descriptor) {
        const hasGetter = Object.prototype.hasOwnProperty.call(descriptor, 'get')
        if (prop === 'top' || prop === 'parent' || prop === 'self' || prop === 'window') {
          descriptor.configurable = true
          if (!hasGetter) {
            descriptor.writable = true
          }
        }
        if (hasGetter) {
          this.#propertiesWithGetter.set(prop, true)
        }
        Object.defineProperty(fakeWindow, prop, Object.freeze(descriptor))
      }
    })
    return fakeWindow
  }

  private _isExcludeProperty(prop: string) {
    if (Window.name === this.#proxy[prop].constructor.name) return true
    return false
  }
  memoriesProperties(props: string[]) {
    for (let prop of props) {
      if (this._isExcludeProperty(prop)) continue
      console.debug('store prop:', prop)
      this.#properties[prop] = this.#proxy[prop]
    }
  }
}

class SandBoxManager {
  #sandboxes: Map<string, JSSandBox> ;
  #current: string;
  static rawWindow: Window;

  constructor() {
    this.#sandboxes = new Map()
    // patchDocumentCreateElement()
    // patchAppendChild()
  }

  private _getOrCreateSandBox(name: string) {
    if (!SandBoxManager.rawWindow) {
      // initialize properties of window
      SandBoxManager.rawWindow = window
    }
    if (this.#sandboxes.has(name)) return this.#sandboxes.get(name)
    const sandbox = new JSSandBox(name)
    this.#sandboxes.set(name, sandbox)
    return sandbox
  }

  has(name: string) {
    return this.#sandboxes.has(name)
  }

  getProxyProperties(proxy: Window) {
    let properties: string[] = []
    Object.getOwnPropertyNames(proxy).filter(prop => {
      properties.push(prop)
    })
    return properties
  }
  async switchSandbox(name: string, scripts: string[]) {
    if (this.#current) {
      const sb = this.#sandboxes.get(this.#current)
      sb!.inactivate()
    }
    let next = this.#sandboxes.get(name)
    if (!next) {
      next = this._getOrCreateSandBox(name)!
      let windowProperties = this.getProxyProperties(SandBoxManager.rawWindow)
      await next.initializeScript(scripts)
      let proxyProperties = this.getProxyProperties(next.proxy)
      // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
      const diff = proxyProperties.filter(item => !windowProperties.includes(item))
        .concat(windowProperties.filter(item => !proxyProperties.includes(item)))
      console.debug('proxy new property:', diff)
      next.memoriesProperties(diff)
    }
    next!.activate()
    this.#current = name
  }

  getCurrentSandBox() {
    if (!this.#current) return null
    return this.#sandboxes.get(this.#current)!
  }
}

export default new SandBoxManager;