import { makeRequireFunction } from '@/../public/ExtensionLoader'
import { createApiFactoryAndRegisterActors } from '../ExtensionHost.API.Impl'
import { isFileExist, getExtensionPath } from '@/../public/Utility'
var _commonjsGlobal = typeof global === 'object' ? global : {};
const Module = require('module')

export class ExtensionModule extends Module {
  exports: any = {};
  private _vm: any;
  private _extensionRequirePaths: string[] = [];
  private _r: any;

  constructor(id: string, parent: NodeModule|null|undefined) {
    super(id, parent)
    this._vm = require('vm')
    this._initSearchPath()
  }

  _compile(content: string, filename: string) {
    const path = require('path')
    const dirname = path.resolve(__dirname, '../../../extension/' + filename)
    var scriptSource = Module.wrap(content.replace(/^#!.*/, ''));
    let options = { filename: filename };
    let script = new this._vm.Script(scriptSource, options);
    var compileWrapper = script.runInThisContext(options);
    let $require = makeRequireFunction(this)
    var args = [this.exports, $require, this, filename, dirname, process, _commonjsGlobal, Buffer];
    compileWrapper.apply(this.exports, args);
  }

  require(path: string) {
    if (path === 'civet') {
      // inject civet to extension
      const apiFactory = createApiFactoryAndRegisterActors()
      return apiFactory(null, null, null)
    }
    if (this._extRequire(path)) {
      return this._r
    }
    return global.require(path)
  }

  private _extRequire(path: string): boolean {
    for (let searchPath of this._extensionRequirePaths) {
      const modulePath = searchPath + '/' + path
      if (isFileExist(modulePath)) {
        this._r = global.require(modulePath)
        return true
      }
    }
    return false
  }

  private _initSearchPath() {
    // search module in these path first. if module is not exist, use default path
    const extensionPath = getExtensionPath()
    this._extensionRequirePaths.push(extensionPath + '/node_modules')
  }
}
