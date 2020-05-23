import ImageBase from '../public/ImageBase'
import localStorage from './LocalStorage'
import NLP from '../public/NLP'
import ExifReader from 'exifreader'
import JString from '../public/String'
import CV from '../public/CV'

export default class JImage extends ImageBase {
  static async build(fullpath, stat) {
    const path = require('path')
    const crypto = require('crypto')
    const sharp = require('sharp')
    const fs = require('fs')
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
