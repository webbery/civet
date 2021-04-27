import { civet } from '../../public/civet'
import storage from '../../public/Kernel'
import { getSuffixFromString, convert2ValidDate } from '../../public/Utility'
import { ReplyType, IMessagePipeline } from '../Message'
import { MessagePipeline } from '../MessageTransfer'
import NLP from '../algorithm/strextract/NLP'
import util from 'util'
import { ResourcePath } from '../common/ResourcePath'

const Kmeans = require('node-kmeans')
const kmeans = util.promisify(Kmeans.clusterize)
const tinyColor = require('tinycolor2')

export class ImageService {
  private _parsers: ImageParser[] = [];
  private _pipeline: MessagePipeline;
  constructor(pipeline: MessagePipeline) {
    this._pipeline = pipeline;
    this._parsers.push(new ImageMetaParser(pipeline))
    this._parsers.push(new ThumbnailParser(pipeline))
    this._parsers.push(new ImagePathParser(pipeline))
    this._parsers.push(new ColorParser(pipeline))
  }
  async read(filepath: ResourcePath): Promise<civet.IResource> {
    const path = require('path')
    const f = path.parse(filepath.local())
    let file = new civet.IResource(undefined)
    file.filename = f.base
    file.path = filepath.local()
    if (filepath.remote()) {
      file.remote = filepath.remote()
    }
    file.meta.push({name: 'filename', value: f.base, type: 'str'})
    file.meta.push({name: 'path', value: filepath.local(), type: 'str'})
    for (let parser of this._parsers) {
      if (!await parser.parse(file)) {
        console.error('parse error:', typeof parser)
        // break
        this._pipeline.error(`${file.filename} parse error: ${typeof parser}`)
      }
    }
    return file
  }
}

class MessageTransfer {
  id: number = 0;
  msg: any;
}

class ImageParser extends civet.IParser {
  pipeline?: IMessagePipeline;
  parse(file: civet.IResource): boolean | Promise<boolean> {
    return true
  }
}

class ImageMetaParser extends ImageParser {
  _typeParser: Map<string, FileTypeMetaParser> = new Map();
  constructor(pipeline: MessagePipeline) {
    super();
    this.pipeline = pipeline;
    const exifParser = new ExifMetaParser;
    this._typeParser.set('jpg', exifParser);
    this._typeParser.set('png', exifParser);
    this._typeParser.set('tif', exifParser);
    this._typeParser.set('gif', exifParser);
    const sharpParser = new SharpMetaParser;
    this._typeParser.set('bmp', sharpParser);
    this._typeParser.set('fit', sharpParser);
  }
  parse(file: civet.IResource): boolean {
    console.info('ImageMetaParser,', file)
    // first try type by suffix
    let type = getSuffixFromString(file.path)
    try {
      // TODO: call interface of type implements, but now we simply read the file
      if (!this._typeParser.has(type)) {
        this.pipeline!.post('onFileResolveFail', [{filname: file.filename, path: file.path, msg: 'can\'t resolve this kind of file'}])
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
      this.pipeline!.post('onFileResolveFail', [{filname: file.filename, path: file.path, msg: 'resolve file error'}])
      return false
    }
    file.id = storage.generateFilesID(1)[0]
    file.meta.push({name: 'addtime', value: new Date().toString(), type: 'date'})
    // this.callback(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file])
    storage.addFiles([file.toJson()])
    return true;
  }
}
class ImagePathParser extends ImageParser {
  private pool: any;
  constructor(pipeline: MessagePipeline) {
    super()
    this.pipeline = pipeline;
    // const workerpool = require('workerpool')
    // let algorithmpath = ''
    // if (process.env.NODE_ENV === 'development') {
    //   algorithmpath = './src/worker/algorithm/strextract/index.js'
    // } else {
    //   console.info('extension path:', __dirname)
    //   algorithmpath = `${__dirname}/../../../extension/strextract/index.js`
    //   // algorithmpath = `${__dirname}/resources/extension/strextract/index.js`
    // }
    // console.info('ENV', process.env.NODE_ENV, 'algorithm_extend path:', algorithmpath)
    // const cpus = require('os').cpus().length
    // this.pool = workerpool.pool(algorithmpath, { minWokers: cpus > 4 ? 4 : cpus, workerType: 'process' })
  }
  parse(file: civet.IResource): boolean {
    // file.tag = await this.pool.exec('getNouns', [file.path]);
    file.tag = NLP.getNouns(file.path)
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
      this.pipeline!.post(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file])
    }
    return true
  }
}

class FileTypeMetaParser {
  parse(file: civet.IResource): Promise<boolean> | boolean {
    return false;
  }
}

class SharpMetaParser extends FileTypeMetaParser{
  async parse(file: civet.IResource): Promise<boolean> {
    const sharp = require('sharp')
    try{
      const image = sharp(file.path)
      const info = await image.on('info')
      console.info('SharpMetaParser', info)
    } catch (err) {
      console.error('SharpMetaParser(' + file.path + ')', err,)
      return false
    }
    return true;
  }
}

class ExifMetaParser extends FileTypeMetaParser{
  parse(file: civet.IResource): boolean {
    const fs = require('fs')
    const buffer = fs.readFileSync(file.path)
    const ExifReader = require('exifreader')
    const meta = ExifReader.load(buffer)
    console.info(meta)
    delete meta.MakerNote
    // datetime
    if (meta.DateTime !== undefined && meta.DateTime.value) {
      file.addMeta('datetime', convert2ValidDate(meta.DateTime.value[0]), 'date')
    }
    // orient
    if (meta.Orientation !== undefined) {
      file.addMeta('orient', meta.Orientation.value, undefined)
    }
    // width, height
    if (!meta.Orientation || meta.Orientation.value === 1 || meta.Orientation.value === 3) {
      file.addMeta('width', this.getImageWidth(meta), 'val')
      file.addMeta('height', this.getImageHeight(meta), 'val')
    } else { // rotation 90
      file.addMeta('height', this.getImageWidth(meta), 'val')
      file.addMeta('width', this.getImageHeight(meta), 'val')
    }
    // size
    const stat = fs.statSync(file.path)
    file.addMeta('size', stat.size, 'val')
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

class ThumbnailParser extends ImageParser{
  constructor(pipeline: MessagePipeline) {
    super()
  }

  async parse(file: civet.IResource): Promise<boolean> {
    const sharp = require('sharp')
    try {
      const image = sharp(file.path)
      let scale = 1
      if (file.width > 200) {
        scale = 200.0 / file.width
      }
      const width = Math.round(file.width * scale)
      const height = Math.round(file.height * scale)
      const data = await image.resize(width, height)
        .jpeg().toBuffer()
      // console.info('ThumbnailParser:', data)
      file.thumbnail = data
      console.info('thumbnail:', typeof data)
      // storage.addMeta([file.id], {name: 'thumbnail', value: file.thumbnail, type: 'bin'})
      file.raw = await image.resize(width, height)
        .raw().toBuffer()
      return true;
    } catch(err) {
      console.error(err)
    }
    return false
  }
}

class ColorParser extends ImageParser {
  private _plate: number[];

  constructor(pipeline: MessagePipeline) {
    super()
    this._plate = []
  }
  async parse(file: civet.IResource): Promise<boolean> {
    if (!!file.raw) {
      const count = file.raw.length / 3;
      let counter = new Map<number, number>()
      for (let start = 0; start < count; start += 3) {
        // const idx = this.rgb2index([0, 255, 0])
        const idx = this.rgb2index([file.raw[start], file.raw[start + 1], file.raw[start + 2]])
        const val = counter.get(idx)
        if (val === undefined) {
          counter.set(idx, 1)
        } else {
          counter.set(idx, val + 1)
        }
      }
      // console.info('counter', counter)
      const topk = Array.from(counter).sort(([, a], [, b]) => {
        return b - a
      }).splice(0, 50)
      // console.info('topk', topk)
      const colors = topk.map((item, idx, arr) => {
        return this.index2rgb(item[0])
      })
      // console.info('color indx:', colors)
      const centers = await kmeans(colors, {k: 6})
      const centroid = centers.map((item: any, idx: any, arr:any) => {
        return tinyColor({r: item.centroid[0], g: item.centroid[1], b: item.centroid[2]}).toHexString()
      })
      file.addMeta('color', centroid, 'color')
      storage.addMeta([file.id], {name: 'color', value: centroid, type: 'color', query: true})
    }
    return true;
  }

  rgb2hsv(colors: number[]): number[] {
    const count = colors.length / 3;
    let hsv: number[] = [];
    for (let start = 0; start < count; start += 3) {
      const val = tinyColor({r: colors[start], g: colors[start + 1], b: colors[start + 2]}).toHsv()
      hsv.push.apply(hsv, val)
    }
    return hsv
  }

  hsv2rgb(colors: number[]): number[] {
    let tinyColor = require('tinycolor2')
    const count = colors.length / 3;
    let rgb: number[] = [];
    for (let start = 0; start < count; start += 3) {
      const val = tinyColor({r: colors[start], g: colors[start + 1], b: colors[start + 2]}).toRgb()
      rgb.push.apply(rgb, val)
    }
    return rgb
  }

  rgb2index(color: number[]): number {
    const ir = Math.floor(color[0] / 16)
    const ig = Math.floor(color[1] / 16)
    const ib = Math.floor(color[2] / 16)
    return Math.floor(ir * 4096 * 256 + ig * 256 + ib)
  }

  index2hsv(index: number): number[] {
    const vv = index / (4096 * 256)
    const h = vv * 16
    index -= vv * (4096 * 256)
    const vw = index / 256
    const s = vw * 16
    index -= vw * 256
    const v = index * 16
    return [h/180.0, s/255.0, v/255.0]
  }

  index2rgb(index: number): number[] {
    const vv = Math.floor(index / (4096 * 256))
    const r = vv * 16
    index -= vv * (4096 * 256)
    const vw = Math.floor(index / 256)
    const g = vw * 16
    index -= vw * 256
    const b = index * 16
    return [Math.floor(r), Math.floor(g), Math.floor(b)]
  }
}
