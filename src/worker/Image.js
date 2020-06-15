import ImageBase from '../public/ImageBase'
import localStorage from './LocalStorage'
import NLP from '../public/NLP'
import ExifReader from 'exifreader'
import JString from '../public/String'
import CV from '../public/CV'
import fs from 'fs'

export class ImageParser {
  async parse(fullpath, stat, stepFinishCB) {
    return parseChain(fullpath, stat, stepFinishCB)
  }
}

const parseChain = async (fullpath, stat, stepFinishCB) => {
  const path = require('path')
  const f = path.parse(fullpath)
  const fid = await localStorage.generateID()
  console.info(f.dir, f.base)
  let fileInfo = {
    id: fid,
    path: f.dir,
    filename: f.base,
    size: stat.size,
    datetime: stat.atime.toString()
  }

  let image = new JImage(fileInfo)
  image.stepCallback = stepFinishCB
  const meta = new ImageMetaParser()
  const text = new ImageTextParser()
  const color = new ImageColorParser()
  meta.nextParser(text)
  text.nextParser(color)
  await meta.parse(image)
}

export class JImage extends ImageBase {
  static async build(fullpath, stat) {
    const path = require('path')
    const crypto = require('crypto')
    const sharp = require('sharp')
    const item = path.basename(fullpath)
    if (JString.isImage(item)) {
      let keywords = NLP.getNouns(fullpath)
      console.info('keyword:', keywords)
      // console.info(dhash)
      const image = fs.readFileSync(fullpath)
      const tags = ExifReader.load(image)
      delete tags['MakerNote']
      console.info(fullpath, tags, stat)
      let size = stat.size
      let thumbnail = null
      if (size > 5 * 1024 * 1024) {
        thumbnail = tags['Thumbnail'].base64
      }
      const logger = require('electron-log')
      // logger.log('START 1')
      // for (let i = 0; i < 100; ++i) {
      //   await sharp(fullpath).toBuffer()
      // }
      // logger.log('END 1')
      logger.log('START 2')
      await CV.sumaryColors(fullpath)
      logger.log('END 2')
      // const colors = CV.sumaryColors(orignalPixels)
      let scaleWidth = Math.ceil(tags['Image Width'].value / 5)
      if (scaleWidth < 8) scaleWidth = tags['Image Width'].value
      const scaleHeight = scaleWidth + 1
      const pixels = await sharp(fullpath)
        .resize(scaleWidth, scaleHeight)
        .grayscale()
        .toBuffer()
      const MD5 = crypto.createHash('md5')
      // console.info(pixels.toString())
      const hash = MD5.update(pixels.toString()).digest('hex')
      // const hash = JString.dhash(image, tags['Image Width'].value, tags['Image Height'].value)
      // const hash = await imghash.hash(fullpath)
      // const hash = '1'
      let type = tags['format']
      if (type === undefined) {
        type = JString.getFormatType(item)
      } else {
        type = JString.getFormatType(tags['format'].description)
      }
      let datetime = tags['DateTime']
      if (datetime === undefined) {
        datetime = stat.atime.toString()
      } else {
        datetime = datetime.value[0]
      }
      const dir = path.dirname(fullpath)
      const fid = await localStorage.generateID()
      let fileInfo = {
        id: fid,
        hash: hash.toString(),
        path: dir,
        filename: item,
        keyword: keywords,
        size: stat.size,
        datetime: datetime,
        width: tags['Image Width'].value,
        height: tags['Image Height'].value,
        thumbnail: thumbnail,
        category: [],
        // colors: colors,
        type: type
      }
      const img = new JImage(fileInfo)
      return img
    }
    return null
  }

  static async loadFromDB() {
  }

  async saveDB() {
    let image = await localStorage.getImageInfo(this.id)
    if (image) {
      console.info('update image')
    } else {
      localStorage.addImages([this])
    }
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
    const fullpath = image.path + '/' + image.filename
    const meta = ExifReader.load(fs.readFileSync(fullpath))
    delete meta['MakerNote']
    let type = meta['format']
    if (type === undefined) {
      type = JString.getFormatType(image.filename)
    } else {
      type = JString.getFormatType(meta['format'].description)
    }
    if (meta['DateTime'] !== undefined && meta['DateTime'].value) {
      image.datetime = meta['DateTime'].value[0]
    }
    image.type = this.getImageFormat(type)
    image.width = this.getImageWidth(meta)
    image.height = this.getImageHeight(meta)
    if (image.size > 5 * 1024 * 1024) {
      image.thumbnail = this.getImageThumbnail(meta)
    }
    try {
      await localStorage.addImages([image])
    } catch (err) {
      console.info('parse metadata error', err)
    }
    console.info('1', image)
    image.stepCallback(image)

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

  async parse(image) {
    const fullpath = image.path + '/' + image.filename
    image.tag = NLP.getNouns(fullpath)
    image.keyword = image.tag
    // await localStorage.updateImage(image.id, 'keyword', image.keyword, this.step)
    try {
      await localStorage.updateImageTags(image.id, image.tag)
      await localStorage.nextStep(image.id)
    } catch (err) {
      console.info('parse text error', err)
    }
    console.info('2', image)
    image.stepCallback(image)

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}

class ImageColorParser extends ImageParseBase {
  constructor() {
    super()
    this.step = 2
  }

  async parse(image) {
    // image.stepFinishCB(image)

    if (this.next !== undefined) {
      this.next.parse(image)
    }
  }
}
