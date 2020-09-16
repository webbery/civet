import sharp from 'sharp'

export default {
  type: 'file',
  name: 'jpg,bmp',
  ext: 'jpg,jpeg,bmp',
  meta: '',
  ui: {
    preview: () => {}
  },
  method: {
    load: async function (src) {
      let {data, info} = await sharp(src).jpeg({force: true}).ensureAlpha()
          .raw().toBuffer({ resolveWithObject: true })
      console.info(info)
      return [data, info.width, info.height]
    }
  }
}