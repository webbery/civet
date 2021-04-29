import fs from 'fs'

export enum ExtensionActiveType {
  ExtContentType = 0, //
  ExtView,       //
  ExtExport
}

class ExtensionPackage {
  private _name: string = '';
  private _version: string = '';
  private _engines: string = '';
  private _main: string = './main.js';
  constructor(file: string) {
    const pack = fs.readFileSync(file, 'utf-8')
    this._name = pack['name']
  }

  get name() { return this._name; }
  get version() { return this._version; }
  get main() { return this._main; }
}
export class ExtensionService {
  private _package: ExtensionPackage;

  
  constructor(packagePath: string) {
    this._package = new ExtensionPackage(packagePath)
  }

  run() {}
}
