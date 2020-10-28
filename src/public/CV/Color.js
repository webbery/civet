class RGB {
  constructor(R, G, B) {
    this._r = R/255.0
    this._g = G/255.0
    this._b = B/255.0
    this._max = Math.max(this._r, this._g, this._b)
    this._min = Math.min(this._r, this._g, this._b)
  }

  hsv() {
    const diff = this._max - this._min
    if (diff === 0) this._h = 0
    else if (this._max === this._r && this._g >= this._b) {
      this._h = 60 * (this._g - this._b) / diff
    } else if (this._max === this._r && this._g < this._b) {
      this._h = 60 * (this._g - this._b) / diff + 360
    } else if (this._max === this._g) {
      this._h = 60 * (this._b - this._r) / diff + 120
    } else if (this._max === this._b) {
      this._h = 60 * (this._r - this._g) / diff + 240
    }
    if (this._max === 0) this._s = 0
    else this._s = diff / this._max
    this._v = this._max
    return {H: this._h, S: this._s, V: this._v}
  }

}

class HSV {
  constructor(h, s, v) {}

  rgb() {}
}

export default {
  hsv: (r, g, b) => {
    const color = new RGB(r, g, b)
    return color.HSV()
  },
  rgb: (h, s, v) => {}
}