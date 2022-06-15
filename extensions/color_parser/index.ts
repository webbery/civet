import { IResource, PropertyType, ResourceProperty } from 'civet'
const util = require('util')
const Kmeans = require('node-kmeans')
const kmeans = util.promisify(Kmeans.clusterize)
const tinyColor = require('tinycolor2')
class ColorParser {
  private _plate: number[] = [];

  constructor() {}
  async parse(filepath: string, file: IResource) {
    let update: ResourceProperty[] =[]
    if (!!file.raw) {
      const count = file.raw.length / 3;
      let counter = new Map<number, number>()
      // const space = file.space
      // console.debug('image raw:', file.raw)
      for (let start = 0; start < count; start += 3) {
        // const idx = this.rgb2index([0, 255, 0])
        const idx = this.rgb2index([file.raw[start], file.raw[start + 1], file.raw[start + 2]])
        // if (idx === 0) continue // remove black color
        const val = counter.get(idx)
        if (val === undefined) {
          counter.set(idx, 1)
        } else {
          counter.set(idx, val + 1)
        }
      }
      // console.info('counter', counter)
      // remove 0
      counter.delete(0)
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
      let prop = {
        name: 'color',
        value: centroid,
        type: PropertyType.String,
        query: true,
        store: true
      }
      update.push(prop)
      file.putProperty(prop)
    }
    return update;
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

  srgb2index(color: number[]): number {
    const ir = Math.floor(color[1] / 16)
    const ig = Math.floor(color[2] / 16)
    const ib = Math.floor(color[3] / 16)
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

export function activate() {
  const metaParser = new ColorParser()
  return {
    read: async (filepath: string, resource: IResource) => {
      return await metaParser.parse(filepath, resource)
    }
  }
}