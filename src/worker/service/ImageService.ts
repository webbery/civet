import { IFileImpl } from '../../public/civet'

export class ImageService {
  private _parsers: ImageParser[] = [];
  constructor() {
    this._parsers.push(new ImageMetaParser)
    this._parsers.push(new ImagePathParser)
  }
  read(filepath: string): boolean {
    const path = require('path')
    const f = path.parse(filepath)
    const baseInfo = {
      meta: [
        { name: 'path', value: filepath, type: 'str' },
        { name: 'filename', value: f.base, type: 'str' },
        { name: 'createtime', value: new Date().toString, type: 'date' }
      ]
    }
    const file = Object.assign(new IFileImpl(), baseInfo)
    console.info('1111')
    for (let parser of this._parsers) {
      parser.parse(file)
    }
    return true
  }
}

class MessageTransfer {
  id: number = 0;
  msg: any;
}

class ImageParser {
  parse(file: IFileImpl): boolean {
    return true
  }
}

class ImageMetaParser extends ImageParser {}
class ImagePathParser extends ImageParser {}
