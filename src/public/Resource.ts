import { IResource, ExtensionContext, IProperty } from 'civet'
import { PropertyType } from './ExtensionHostType'

export function readThumbnail(thumbnail: any) {
  return 'data:image/jpg;base64,' + btoa(String.fromCharCode.apply(null, thumbnail))
}

export class DisplayProperty{
  name: string;
  query: boolean;
  type: PropertyType;
  value: any;
}

export class SerializeAccessor {
  constructor() {}
  access(property: IProperty): DisplayProperty|null {
    switch (property.name) {
      case 'thumbnail': return null;
      case 'filename': return null;
      case 'path': return null;
      case 'filetype': return null;
      case 'tag': return null;
      default: break
    }
    return {name: property.name, type: property.type, value: property.value, query: property.query}
  }
}

export class StorageAccessor {
  constructor() {}
  access(property: IProperty): DisplayProperty|null {
    switch (property.name) {
      case 'filename': return {name: 'filename', type: property.type, value: property.value, query: false};
      case 'path': return {name: 'path', type: property.type, value: property.value, query: false};
      case 'filetype': return null;
      case 'tag': return null;
      default: break
    }
    return {name: property.name, type: property.type, value: property.value, query: property.query}
  }
}

/**
* Resource represent an image/file/html or other uri.
*/
export class Resource implements IResource {
  id: number = 0;
  type: string = '';
  name: string = '';
  private _path: string = '';
  private _remote: string|null = '';
  private meta: IProperty[] = [];
  tag: string[] = [];
  category: string[] = [];
  thumnail: ArrayBuffer;
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
    if (!this.thumbnail) this.thumbnail = property.thumbnail
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

  public putProperty(prop: IProperty): void {
    const name = prop.name
    let property = this.getProperty(name)
    if (property === null) {
      this.meta.push(prop)
      return
    }
    property.value = prop.value
  }
  
  public getProperty(name: string): IProperty|null {
    for (let item of this.meta) {
      if (item.name === name) {
        return item
      }
    }
    return null
  }

  public getPropertyValue(name: string): any {
    for (let item of this.meta) {
      if (item.name === name) {
        return item.value
      }
    }
    return null
  }

  public removePropery(name: string):boolean {
    return false
  }

  public toJson(accessor?: SerializeAccessor|StorageAccessor) {
    let serialize = {
      id: this.id,
      filename: this.name,
      path: this._path,
      thumbnail: this.thumnail,
      filetype: this.filetype,
      keyword: this.keyword,
      tag: this.tag,
      category: this.category
    }
    if (!accessor) {
      serialize['meta'] = this.meta
      return serialize
    }
    serialize['meta'] = []
    for (let prop of this.meta) {
      if (serialize[prop.name]) continue
      const p = accessor.access(prop)
      if (!p) continue
      serialize['meta'].push(p)
    }
    return serialize
  }
}