import Color from 'Color'
import { imageHash } from 'image-hash'

const DEFAULT_SIDE = 4
const DEDAULT_SQUARE = DEFAULT_SIDE * DEFAULT_SIDE
const DEFAULT_BIN = DEDAULT_SQUARE * DEFAULT_SIDE
class Histogram {
  constructor(image, bin) {
    this._table = {}
    // 256*256*128 分成64pix/bin
    const size = 256 * 256 * 128 / DEFAULT_BIN
    this._hist = new Array(size)
    this._hist.fill(0)
    for (let idx = 0; idx < image.length; idx += 2) {
      const r = image[idx]
      const g = image[idx + 1]
      const b = image[idx + 2]
      const index = this.rgb2index(r, g, b)
      this._hist[index] += 1
    }
  }

  rgb2index(r, g, b) {
    const hsv = Color.hsv(r, g, b)
    const h = hsv.H / DEFAULT_SIDE
    const s = hsv.S / DEFAULT_SIDE
    const v = hsv.V / DEFAULT_SIDE
    return parseInt(h) * 256 * 128 / DEDAULT_SQUARE + parseInt(s) * 256 / DEFAULT_SIDE + parseInt(v)
  }

  index2rgb(index) {}

  // 保留最重要的9个颜色
  simplify(cnt = 9) {}
}

export default {
  colorHistogram: (image) => {
    const hist = new Histogram(imageHash)
    hist.simplify()
  }
}
