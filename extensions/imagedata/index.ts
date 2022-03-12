import { IResource, PropertyType } from 'civet'
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
      file.putProperty({
        name: 'thumbnail',
        value: data,
        type: PropertyType.Binary,
        query: false,
        store: true
      })
      // update preview
      file.thumbnail = data
      // console.info('thumbnail:', typeof data)
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

export function activate() {
  const dataParser = new DataParser()
  return {
    read: (filepath: string, resource: IResource) => {
      return dataParser.parse(filepath, resource)
    }
  }
}