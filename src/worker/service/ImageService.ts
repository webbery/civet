import { IFileImpl, Parser } from '../../public/civet'
import storage from '../../public/Kernel'
import { getSuffixFromString, convert2ValidDate } from '../../public/Utility'
import { reply2Renderer, ReplyType } from '../transfer'

export class ImageService {
  private _parsers: ImageParser[] = [];
  constructor() {
    this._parsers.push(new ImageMetaParser)
    this._parsers.push(new ImagePathParser)
  }
  read(filepath: string): IFileImpl | null {
    const path = require('path')
    const f = path.parse(filepath)
    let file = new IFileImpl(undefined)
    file.filename = f.base
    file.path = filepath
    file.meta.push({name: 'filename', value: f.base, type: 'str'})
    file.meta.push({name: 'path', value: filepath, type: 'str'})
    for (let parser of this._parsers) {
      if (!parser.parse(file)) return null
    }
    return file
  }
}

class MessageTransfer {
  id: number = 0;
  msg: any;
}

class ImageParser extends Parser {
  parse(file: IFileImpl): boolean | Promise<boolean> {
    return true
  }
}

class ImageMetaParser extends ImageParser {
  _typeParser: Map<string, FileTypeMetaParser> = new Map();
  constructor() {
    super();
    this.callback = reply2Renderer;
    const exifParser = new ExifMetaParser;
    this._typeParser.set('jpg', exifParser);
    this._typeParser.set('png', exifParser);
    this._typeParser.set('tif', exifParser);
    this._typeParser.set('gif', exifParser);
    this._typeParser.set('bmp', new BmpMetaParser);
  }
  parse(file: IFileImpl): boolean {
    console.info('ImageMetaParser,', file)
    // first try type by suffix
    let type = getSuffixFromString(file.path)
    try {
      // TODO: call interface of type implements, but now we simply read the file
      if (!this._typeParser.has(type)) {
        this.callback('onFileResolveFail', [{filname: file.filename, path: file.path, msg: 'can\'t resolve this kind of file'}])
        return false
      }
      const parser = this._typeParser.get(type);
      if (!parser) return false
      if (!parser.parse(file)) {
        return false
      }
      file.filetype = type
      file.meta.push({name: 'type', value: type, type: 'str'})
    } catch (err) {
      console.error('ImageMetaParser:', err)
      this.callback('onFileResolveFail', [{filname: file.filename, path: file.path, msg: 'resolve file error'}])
      return false
    }
    file.id = storage.generateFilesID(1)[0]
    file.meta.push({name: 'createtime', value: new Date().toString(), type: 'date'})
    // this.callback(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file])
    storage.addFiles([file.toJson()])
    return true;
  }
}
class ImagePathParser extends ImageParser {
  private pool: any;
  constructor() {
    super()
    this.callback = reply2Renderer;
    const workerpool = require('workerpool')
    let algorithmpath = ''
    if (process.env.NODE_ENV === 'development') {
      algorithmpath = './src/worker/algorithm/index.js'
    } else {
      console.info('extension path:', __dirname)
      algorithmpath = `${__dirname}/resources/extension/strextract/index.js`
    }
    console.info('ENV', process.env.NODE_ENV, 'algorithm_extend path:', algorithmpath)
    const cpus = require('os').cpus().length
    this.pool = workerpool.pool(algorithmpath, { minWokers: cpus > 4 ? 4 : cpus, workerType: 'process' })
  }
  async parse(file: IFileImpl): Promise<boolean> {
    file.tag = await this.pool.exec('getNouns', [file.path]);
    if (file.tag.length > 0) {
      file.keyword = file.tag
      console.info('ImageTextParser', file.tag)
      try {
        console.info(file)
        storage.setTags([file.id], file.tag)
      } catch (err) {
        console.info('parse text error', err)
        return false
      }
      this.callback(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file])
    }
    return true
  }
}

class FileTypeMetaParser {
  parse(file: IFileImpl): boolean {
    return false;
  }
}

class BmpMetaParser extends FileTypeMetaParser{}

class ExifMetaParser extends FileTypeMetaParser{
  parse(file: IFileImpl): boolean {
    const fs = require('fs')
    const buffer = fs.readFileSync(file.path)
    const ExifReader = require('exifreader')
    const meta = ExifReader.load(buffer)
    delete meta.MakerNote
    // datetime
    if (meta.DateTime !== undefined && meta.DateTime.value) {
      file.meta.push({name: 'datetime', value: convert2ValidDate(meta.DateTime.value[0]), type: 'date', desc: ''})
    }
    // orient
    if (meta.Orientation !== undefined) {
      file.meta.push({name: 'orient', value: meta.Orientation.value, desc: ''})
    }
    // width, height
    if (!meta.Orientation || meta.Orientation.value === 1 || meta.Orientation.value === 3) {
      file.meta.push({name: 'width',value: this.getImageWidth(meta), type: 'val'})
      file.meta.push({name: 'height', value: this.getImageHeight(meta), type: 'val'})
    } else { // rotation 90
      file.meta.push({name: 'height', vlaue: this.getImageWidth(meta), type: 'val'})
      file.meta.push({name: 'width', value: this.getImageHeight(meta), type: 'val'})
    }
    // size
    const stat = fs.statSync(file.path)
    file.meta.push({name: 'size', value: stat.size, type:'val'})
    return true;
  }

  getImageWidth(meta: any): number {
    if (meta['Image Width']) return meta['Image Width'].value
    if (meta.ImageWidth) return meta.ImageWidth.value
    return 0
  }

  getImageHeight(meta: any): number {
    if (meta['Image Height']) return meta['Image Height'].value
    if (meta.ImageLength) return meta.ImageLength.value
    return 0
  }
}

// function injectReply(reply: any) {
//   reply.prototype.callback = reply2Renderer
// }