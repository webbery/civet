import { IResource, ExtensionContext, ResourceProperty } from 'civet'
import { PropertyType } from './ExtensionHostType'


export class DisplayProperty{
  name: string;
  query: boolean;
  type: PropertyType;
  value: any;
}

export class SerializeAccessor {
  constructor() {}
  access(property: ResourceProperty): DisplayProperty|null {
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
  access(property: ResourceProperty): DisplayProperty|null {
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
  meta: ResourceProperty[] = [];
  tag: string[] = [];
  category: string[] = [];
  thumbnail: ArrayBuffer;
  anno?: string[];
  keyword: string[] = [];
  [propName: string]: any;

  constructor(property: any | undefined) {
    if (!property) return
    this.id = property.id || property.fileid
    this.filetype = property.filetype || property.type || 'img'
    this.type = property.filetype ||  property.type || 'img'
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

  public putProperty(prop: ResourceProperty): void {
    const name = prop.name
    let property = this.getProperty(name)
    if (property === null) {
      this.meta.push(prop)
      return
    }
    property.value = prop.value
  }
  
  public getProperty(name: string): ResourceProperty|null {
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

  public erase(): boolean {
    return true
  }
  
  public update(resource: Resource) {
    console.info('update', resource)
    const props = Object.getOwnPropertyNames(resource)
    for (let prop of props) {
      this._update(prop, resource[prop])
    }
    console.info('updated', this)
  }

  private _update(propname: string, value: any) {
    if (!value) return
    if (propname === 'meta') {
      for (let prop of value) {
        this._update(prop.name, prop.value)
      }
    }
    this[propname] = value
  }

  public toJson(accessor?: SerializeAccessor|StorageAccessor) {
    let serialize = {
      id: this.id,
      filename: this.name,
      path: this._path,
      thumbnail: this.thumbnail,
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
      // if (serialize[prop.name]) continue
      const p = accessor.access(prop)
      if (!p) continue
      serialize['meta'].push(p)
    }
    return serialize
  }
}