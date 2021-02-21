import FileBase from '../public/FileBase'
import ExifReader from 'exifreader'
import JString from '../public/String'
import Utility from '../public/Utility'
// import CV from '../public/ImageProcess'
import fs from 'fs'
// import { imageHash } from 'image-hash'
// import sharp from 'sharp'
// import util from 'util'
import storage from '../public/Kernel'
// import TaskManager from './WorkerPool/TaskManager'
const workerpool = require('workerpool')
let algorithmpath = ''
if (process.env.NODE_ENV === 'development') {
  algorithmpath = `./src/worker/algorithm/index.js`
} else {
  console.info('extension path:', __dirname)
  algorithmpath = `${__dirname}/resources/extension/strextract/index.js`
}
console.info('ENV', process.env.NODE_ENV, 'algorithm_extend path:', algorithmpath)
const cpus = require('os').cpus().length
const pool = workerpool.pool(algorithmpath, {minWokers: cpus > 4 ? 4 : cpus, workerType: 'process'})

// const jpegEncode = util.promisify(jpegasm.encode)
// const pHash = util.promisify(imageHash)
export class ImageParser {
  constructor(fullpath) {
    this.fullpath = fullpath
  }

  parse(stat, stepFinishCB) {
    const path = require('path')
    const f = path.parse(this.fullpath)
    console.info(f.dir, f.base, this.hardLinkDir)
    // const bakFilepath = this.hardLinkDir + '/' + f.base
    // fs.linkSync(fullpath, bakFilepath)
    const fid = storage.generateFilesID(1)
    let fileInfo = {
      fileid: fid[0],
      meta: [
        { name: 'path', value: this.fullpath, type: 'str' },
        { name: 'filename', value: f.base, type: 'str' },
        { name: 'size', value: stat.size, type: 'value' },
        { name: 'datetime', value: stat.atime.toString(), type: 'date' },
        { name: 'createtime', value: new Date().toString, type: 'date' }
      ]
    }
    return parseChain(fileInfo, stepFinishCB)
  }
}

const parseChain = (fileInfo, stepFinishCB) => {
  let image = new JImage(fileInfo)
  image.stepCallback = stepFinishCB
  const meta = new ImageMetaParser()
  const text = new ImageTextParser()
  const color = new ImageColorParser()
  meta.nextParser(text)
  text.nextParser(color)
  meta.parse(image)
  return image
}

export class JImage extends FileBase {
  constructor(json) {
    super(json, 'image')
  }

  toJson() {
    return JSON.parse(JSON.stringify(this))
  }
}

class ImageParseBase {
  constructor() {
    this.maxStep = 2
  }

  nextParser(parser) {
    this.next = parser
  }
}

class ImageMetaParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 0
  }

  async parse(image) {
    const fullpath = image.path
    const buffer = fs.readFileSync(fullpath)
    // const liklyFiles = Storage.findFiles({hash: hashValue})
    // if (liklyFiles && liklyFiles.length > 0) {
    //   console.info('comparing ...')
    // }
    const meta = ExifReader.load(buffer)
    delete meta['MakerNote']
    let type = meta['format']
    if (type === undefined) {
      type = JString.getFormatType(image.filename)
    } else {
      type = JString.getFormatType(meta['format'].description)
    }
    // const thumbnail = this.getImageThumbnail(buffer)
    // image.addMeta('thumbnail', thumbnail)
    // const hashValue = await pHash({ext: 'image/jpeg', data: thumbnail}, 16, true)
    // console.info('hash: ', hashValue)
    // image.addMeta('hash', hashValue)

    if (meta['DateTime'] !== undefined && meta['DateTime'].value) {
      // image.datetime = meta['DateTime'].value[0]
      image.addMeta('datetime', Utility.convert2ValidDate(meta['DateTime'].value[0]), 'date')
    }
    image.addMeta('type', this.getImageFormat(type))
    if (!meta['Orientation']) {
      image.addMeta('orient', meta['Orientation'])
    }
    if (!meta['Orientation'] || meta['Orientation'] === 0) {
      image.addMeta('width', this.getImageWidth(meta))
      image.addMeta('height', this.getImageHeight(meta))
    } else { // rotation 90
      image.addMeta('height', this.getImageWidth(meta))
      image.addMeta('width', this.getImageHeight(meta))
    }
    try {
      storage.addFiles([image])
    } catch (err) {
      console.info('parse metadata error', err)
    }
    // let files = Storage.getFilesInfo([image.id])
    // console.info(files)

    // reply as quick as we can
    image.stepCallback(undefined, image)

    if (this.next !== undefined) {
      this.next.parse(image, buffer)
    }
  }

  getImageWidth(meta) {
    if (meta['Image Width']) return meta['Image Width'].value
    if (meta['ImageWidth']) return meta['ImageWidth'].value
    console.info('width error', meta)
  }

  getImageHeight(meta) {
    if (meta['Image Height']) return meta['Image Height'].value
    if (meta['ImageLength']) return meta['ImageLength'].value
  }

  getImageTime(meta) {
    if (meta['DateTime'] !== undefined) {
      return meta['DateTime'].value[0]
    }
    console.info('image time error', meta)
  }

  getImageThumbnail(width, height, buffer) {
    // const minVal = Math.min(width, height)
    // if (minVal < 200) {
    //   return sharp(buffer).jpeg({quantisationTable: 8}).toBuffer()
    // }
    // if (width < height) {
    //   const scale = width / 200.0
    //   const newHeight = parseInt(height / scale)
    //   const newWidth = 200
    //   return sharp(buffer).resize(newWidth, newHeight).jpeg({quantisationTable: 8}).toBuffer()
    // } else {
    //   const scale = height / 200.0
    //   const newHeight = 200
    //   const newWidth = parseInt(width / scale)
    //   return sharp(buffer).resize(newWidth, newHeight).jpeg({quantisationTable: 8}).toBuffer()
    // }
  }

  getImageFormat(str) {
    console.info('format', str)
    switch (str.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'jpg'
      case 'tif':
      case 'tiff':
        return 'tif'
      case 'bmp':
        return 'bmp'
      case 'gif':
        return 'gif'
      case 'png':
        return 'png'
      default:
        return 'unknow'
    }
  }

  _translateArrayBufferToBase64(buffer) {
    let binaryStr = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0, len = bytes.byteLength; i < len; i++) {
      binaryStr += String.fromCharCode(bytes[i])
    }
    return window.btoa(binaryStr)
  }

  _translateBase64ToArrayBuffer(base64) {
    const binaryStr = window.atob(base64)
    const byteLength = binaryStr.length
    const bytes = new Uint8Array(byteLength)
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    return bytes.buffer
  }
}

class ImageTextParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 1
  }

  // task(fullpath) {
  //   console.info('NLP task')
  //   NLP.getNouns(fullpath)
  // }

  async parse(image, buffer) {
    const fullpath = image.path
    console.info('parse tag:', fullpath)
    // image.tag = await TaskManager.exec(NLP.getNouns, [fullpath])
    // image.tag = NLP.getNouns(fullpath)
    image.tag = await pool.exec('getNouns', [fullpath])
    // pool.terminate()
    console.info('image tag:', image.tag)
    if (image.tag.length > 0) {
      image.keyword = image.tag
      console.info('ImageTextParser', image.tag)
      try {
        console.info(image)
        storage.setTags([image.id], image.tag)
      } catch (err) {
        console.info('parse text error', err)
      }
    }
    // image.stepCallback(undefined, image)
    if (this.next !== undefined) {
      this.next.parse(image, buffer)
    }
  }
}

class ImageColorParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 2
  }

  async parse(image, buffer) {
    // const pixel = await sharp(buffer).jpeg({force: true}).raw().toBuffer({ resolveWithObject: true })
    // console.info(pixel)
    // CV.sumaryColors(pixel)
    image.color = [0xFF0000, 0x00FF00, 0x0000FF]
    // Storage.updateFile({id: image.id}, {color: image.color, step: 0b100})

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}
