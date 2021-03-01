export interface IFile {
  id: number;
  filename: string;
  path: string;
  filetype: string;
  meta: any;
  keyword: string[];
  category: string[];
  tag: string[];
  anno?: string[];
}

export class IFileImpl{
  id: number = 0;
  private _filename: string = '';
  private _path: string = '';
  filetype: string = '';
  meta: any[] = [];
  keyword: string[] = [];
  category: string[] = [];
  tag: string[] =[];
  anno?: string[];
  [key: string]: any;
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
    if (!this.path) this.path = property.path || ''
    if (!this.filename) this.filename = property.filename || ''
  }

  public get filename() { return this._filename; }
  public set filename(name: string) { this._filename = name;}
  public get path() { return this._path; }
  public set path(val: string) {this._path = val;}
  
  public addMeta(key: string, value: any, type: string | undefined): void {
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
}

export enum MessageState{
  UNINIT = 0,
  PENDING = 1,
  FINISH = 2
}

export class Message {
  id: number = 0;
  state: number = MessageState.UNINIT;
  type: string = '';
  tick: number = 0;   // waitting time, unit second
  msg: any;
}

export class Parser {
  callback: Function = ():void =>{ console.error('use empty callback')};
}