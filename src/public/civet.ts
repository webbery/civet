
export namespace civet {
  /**
      * verson of civet extension
      */
  export const version: string = "0.0.1";
  class ExtensionContext {
    constructor() {}
    send(msg: string | ArrayBuffer): void {}
    get currentDB(): string {
      return ''
    }
    set currentDB(dbname: string) {}
    static _isConnecting: boolean;
  }
  /**
   * Resource represent an image/file/html or other uri.
   */
  export class IResource {
    id: number = 0;
    type: string = '';
    private name: string = '';
    private _path: string = '';
    private _remote: string|null = '';
    meta: Object[] = [];
    tag: string[] = [];
    category: string[] = [];
    anno?: string[];
    keyword: string[] = [];
    [propName: string]: any;

    constructor(property: any | undefined) {
      if (!property) return
      this.id = property.id || property.fileid
      this.filetype = property.filetype || 'img'
      this.type = property.filetype || 'img'
      this.meta = property.meta || []
      this.keyword = property.keyword || []
      this.category = property.category || property.class || []
      this.tag = property.tag || []
      for (const item of property.meta) {
        // console.info(item)
        if (item.name === 'width' || item.name === 'height') {
          this[item.name] = parseInt(item.value)
        } else {
          this[item.name] = item.value
        }
      }
      if (!this._path) this._path = property.path || ''
      if (!this._remote) this._remote = property.remote || undefined
      if (!this.name) this.name = property.filename || ''
    }

    public get filename() {
      return this.name
    }
    public set filename(name: string) {
      this.name = name
    }

    public get path() { return this._path }
    public set path(val: string) {
      this._path = val
    }
    public get remote() {return this._remote}
    public set remote(val: string | null) {
      this._remote = val
    }

    public addMeta(key: string, value: any, type: string | undefined): void {
      if (this[key]) {
        console.info('key ' + key + ' is exist' )
        return
      }
      this[key] = value
      this.meta.push({name: key, value: value, type: type})
    }

    public toJson() {
      return {
        id: this.id,
        filename: this._filename,
        path: this._path,
        meta: this.meta,
        filetype: this.filetype,
        keyword: this.keyword,
        tag: this.tag,
        category: this.category
      }
    }

    // load(path: string): Thenable<boolean> {
    //   return true
    // }
    // save(path: string): Thenable<boolean> {
    //   return true
    // }
  }

  export class IParser {
    // pipeline?: IMessagePipeline;
  }

  export interface Thenable<T> {
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
  }
  /**
      * extension context
      */
  export let extensionContext: ExtensionContext;
  export let activate: ((context: ExtensionContext) => any) | null = null;
  export let unactivate: (() => any) | null = null;
  export interface IProperty {
    readonly key: string;
  }
  /**
      * resource of uri, such as file, web page, or remote machine setting etc.
      */
  export let resource: IResource;
}

