import FileBase from '../public/FileBase'
import Storage from '../public/Kernel'
import NLP from '../public/NLP'
import ExifReader from 'exifreader'
import JString from '../public/String'
// import CV from '../public/CV'
import fs from 'fs'
import { imageHash } from 'image-hash'
import util from 'util'
// import WorkerPool from './WorkerPool/WorkerPool'

const pHash = util.promisify(imageHash)
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
    const fid = Storage.generateFilesID(1)
    let fileInfo = {
      fileid: fid[0],
      meta: [
        { name: 'path', value: this.fullpath, type: 'str' },
        { name: 'filename', value: f.base, type: 'str' },
        { name: 'size', value: stat.size, type: 'value' },
        { name: 'datetime', value: stat.atime.toString(), type: 'value' }
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
    const hashValue = await pHash({ext: 'image/jpeg', data: buffer}, 16, true)
    console.info('hash: ', hashValue)
    image.addMeta('hash', this.getImageFormat(hashValue))
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
    if (meta['DateTime'] !== undefined && meta['DateTime'].value) {
      // image.datetime = meta['DateTime'].value[0]
      image.addMeta('datetime', meta['DateTime'].value[0])
    }
    image.addMeta('type', this.getImageFormat(type))
    image.addMeta('width', this.getImageWidth(meta))
    image.addMeta('height', this.getImageHeight(meta))
    if (image.size > 5 * 1024 * 1024) {
      const thumbnail = this.getImageThumbnail(meta)
      image.addMeta('thumbnail', thumbnail)
    }
    console.info('1', image)
    try {
      Storage.addFiles([image])
    } catch (err) {
      console.info('parse metadata error', err)
    }
    let files = Storage.getFilesInfo([image.id])
    console.info(files)

    // image.stepCallback(undefined, image)

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }

  getImageWidth(meta) {
    if (meta['Image Width']) return meta['Image Width'].value
    if (meta['ImageWidth']) return meta['ImageWidth'].value
    console.info('width error', meta)
  }

  getImageHeight(meta) {
    if (meta['Image Height']) return meta['Image Width'].value
    if (meta['ImageLength']) return meta['ImageLength'].value
  }

  getImageTime(meta) {
    if (meta['DateTime'] !== undefined) {
      return meta['DateTime'].value[0]
    }
    console.info('image time error', meta)
  }

  getImageThumbnail(meta) {
    if (meta['Thumbnail']) return meta['Thumbnail'].base64
    console.info('thumbnail', meta)
    return undefined
  }

  getImageFormat(str) {
    console.info('format', str)
    switch (str) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg'
      case 'tif':
      case 'tiff':
        return 'tiff'
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
}

class ImageTextParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 1
  }

  task(fullpath) {
    console.info('NLP task')
    NLP.getNouns(fullpath)
  }

  async parse(image) {
    const fullpath = image.path + '/' + image.filename
    // WorkerPool.addTask(this.task, fullpath)
    image.tag = NLP.getNouns(fullpath)
    image.keyword = image.tag
    console.info('ImageTextParser', image.tag)
    try {
      console.info(image)
      Storage.setTags([image.id], image.tag)
    } catch (err) {
      console.info('parse text error', err)
    }
    // image.stepCallback(undefined, image)

    // if (this.next !== undefined) {
    //   this.next.parse(image)
    // }
  }
}

class ImageColorParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 2
  }

  async parse(image) {
    // image.stepFinishCB(image)
    image.color = [0xFF0000, 0x00FF00, 0x0000FF]
    Storage.updateFile({id: image.id}, {color: image.color, step: 0b100})

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}
