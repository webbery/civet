import { makeRequireFunction } from '@/../public/ExtensionLoader'
import { createApiFactoryAndRegisterActors } from '../ExtensionHost.API.Impl'
var _commonjsGlobal = typeof global === 'object' ? global : {};
const Module = require('module')


export class ExtensionModule extends Module {
  exports: any = {};
  private _vm: any;

  constructor(id: string, parent: NodeModule|null|undefined) {
    super(id, parent)
    this._vm = require('vm')
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
    return global.require(path)
  }
}

export class ExtensionRequire{
  main: any;
  extensions: any;
  cache: any;
  paths: any;

  constructor(path: string) {
    this.paths = path
  }

  resolve(request: any, options: any) {
    // return module.constructor._resolveFilename(request, mod, false, options);
  }
}