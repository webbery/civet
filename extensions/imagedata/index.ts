
class DataParser{
  constructor() {
  }

  async parse(filepath: string, file: any) {
    const Sharp = require('sharp')
    try {
      console.info('sharp:', Sharp)
      const image = Sharp(filepath)
      let scale = 1
      if (file.width > 200) {
        scale = 200.0 / file.width
      }
      const width = Math.round(file.width * scale)
      const height = Math.round(file.height * scale)
      const data = await image.resize(width, height)
        .jpeg().toBuffer()
      // console.info('ThumbnailParser:', data)
      file.addMeta('thumbnail', data)
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
    read: (filepath: string, resource: any) => {
      return dataParser.parse(filepath, resource)
    }
  }
}