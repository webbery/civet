
function convert2ValidDate(str: string): string {
  if (str.match(/[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/g)) {
    // YYYY:MM:DD hh:mm:ss
    const year = str.substr(0, 4)
    const month = str.substr(5, 2)
    const day = str.substr(8, 2)
    return year + '/' + month + '/' + day + str.substr(10, 9)
  }
  return str
}

class MetaParser {
  constructor() {}

  parse(filepath: string, file: any) {
    const fs = require('fs')
    const buffer = fs.readFileSync(filepath)
    const ExifReader = require('exifreader')
    const meta = ExifReader.load(buffer)
    console.info('meta', meta)
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
    const stat = fs.statSync(filepath)
    file.addMeta('size', stat.size, 'val')
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

export function activate() {
  const metaParser = new MetaParser()
  return {
    read: (filepath: string, resource: any) => {
      metaParser.parse(filepath, resource)
      return true
    }
  }
}