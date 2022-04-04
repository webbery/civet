import { IResource, ResourceProperty, PropertyType } from 'civet'

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

  parse(filepath: string, file: IResource) {
    const fs = require('fs')
    const buffer = fs.readFileSync(filepath)
    const ExifReader = require('exifreader')
    const meta = ExifReader.load(buffer)
    console.info('meta', meta)
    delete meta.MakerNote
    let update: ResourceProperty[] = []
    // datetime
    if (meta.DateTime !== undefined && meta.DateTime.value) {
      console.info(meta.DateTime.value)
      const prop :ResourceProperty = {
        name: 'datetime',
        value: convert2ValidDate(meta.DateTime.value[0]),
        type: PropertyType.String,
        query: true,
        store: true
      };
      update.push(prop)
      file.putProperty(prop)
      // file.addMeta('datetime', convert2ValidDate(meta.DateTime.value[0]), 'date')
    }
    // orient
    if (meta.Orientation !== undefined) {
      const prop :ResourceProperty = {
        name: 'orient',
        value: meta.Orientation.value,
        type: PropertyType.Number,
        query: false,
        store: true
      };
      update.push(prop)
      file.putProperty(prop)
    }
    // width, height
    if (!meta.Orientation || meta.Orientation.value === 1 || meta.Orientation.value === 3) {
      let prop: ResourceProperty = {
        name: 'width',
        value: this.getImageWidth(meta),
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
      prop = {
        name: 'height',
        value: this.getImageHeight(meta),
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
      // file.addMeta('height', this.getImageHeight(meta), 'val')
    } else { // rotation 90
      let prop: ResourceProperty = {
        name: 'width',
        value: this.getImageWidth(meta),
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
      prop = {
        name: 'height',
        value: this.getImageHeight(meta),
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
    }
    // size
    const stat = fs.statSync(filepath)
    let prop: ResourceProperty = {
      name: 'size',
      value: stat.size,
      type: PropertyType.Number,
      query: true,
      store: true
    }
    update.push(prop)
    file.putProperty(prop)
    // GPS
    if (meta.GPSLatitude && meta.GPSLongitude) {
      prop = {
        name: 'lng',
        value: parseFloat(meta.GPSLongitude['description']) * 100000,
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
      prop = {
        name: 'lat',
        value: parseFloat(meta.GPSLatitude['description']) * 100000,
        type: PropertyType.Number,
        query: false,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
    }
    return update
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

class DataParser{
  constructor() {
  }

  getNumberProperty(file: IResource, name: string): number {
    const prop = file.getProperty(name)
    if (!prop) {
      return 0;
    }
    return prop.value
  }

  async parse(filepath: string, file: IResource) {
    const Sharp = require('sharp')
    try {
      const image = Sharp(filepath)
      let scale = 1
      const w = this.getNumberProperty(file, 'width')
      console.debug('image:', w, file)
      if (w > 200) {
        scale = 200.0 / w
      }
      const h = this.getNumberProperty(file, 'height')
      const width = Math.round(w * scale)
      const height = Math.round(h * scale)
      const data = await image.resize(width, height)
        .jpeg().toBuffer()
      // console.info('ThumbnailParser:', data)
      let prop: ResourceProperty = {
        name: 'thumbnail',
        value: data,
        type: PropertyType.Binary,
        query: false,
        store: true
      }
      let update: ResourceProperty[] = []
      update.push(prop)
      file.putProperty(prop)
      // update preview
      file.thumbnail = data
      // console.info('thumbnail:', typeof data)
      // storage.addMeta([file.id], {name: 'thumbnail', value: file.thumbnail, type: 'bin'})
      file.raw = await image.resize(width, height)
        .raw().toBuffer()
      return update
    } catch(err) {
      console.error(err)
    }
    return null
  }
}

export function activate() {
  const metaParser = new MetaParser()
  const dataParser = new DataParser()
  return {
    read: async (filepath: string, resource: IResource) => {
      let updates = metaParser.parse(filepath, resource)
      const data = await dataParser.parse(filepath, resource)
      if (!data) return updates
      return updates.concat(data)
    }
  }
}