const NLP = (function () {
  let Segment = require('segment')
  let POSTAG = Segment.POSTAG
  let segment = new Segment()
  segment.useDefault()
  return {
    POSTAG: POSTAG,
    retrieveNoun: (str) => {
      let validNames = str.match(/[\u4e00-\u9fa5]+/g)
      let tags = []
      if (validNames !== null) {
        const segs = segment.doSegment(validNames.join(''))
        for (let word of segs) {
          if (word.p & (POSTAG.D_N | POSTAG.A_NR | POSTAG.A_NS | POSTAG.A_NT)) {
            tags.push(word.w)
          }
        }
      }
      return tags
    }
  }
})()
export default {
  findString: (strs, target) => {
    for (let idx of strs) {
      if (strs[idx].indexOf(target) >= 0) return idx
    }
    return -1
  },
  getNouns: (str) => {
    return NLP.retrieveNoun(str)
  },
  isImage: (filename) => {
    filename = filename.toLowerCase()
    if (filename.indexOf('.jpg') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.png') > 0 ||
      filename.indexOf('.jpeg') > 0 || filename.indexOf('.gif') > 0 || filename.indexOf('.tiff') > 0) {
      return true
    }
    return false
  },
  dhash: (pixels, width, height) => {
    let median = function(data) {
      let mdarr = data.slice(0)
      mdarr.sort(function(a, b) { return a - b })
      if (mdarr.length % 2 === 0) {
        return (mdarr[mdarr.length / 2] + mdarr[mdarr.length / 2 + 1]) / 2.0
      }
      return mdarr[Math.floor(mdarr.length / 2)]
    }
    let bitsToHexhash = function(bitsArray) {
      let hex = []
      for (let i = 0; i < bitsArray.length; i += 4) {
        let nibble = bitsArray.slice(i, i + 4)
        hex.push(parseInt(nibble.join(''), 2).toString(16))
      }
      return hex.join('')
    }
    let bmvbhashEven = function(data, bits) {
      let blocksizeX = Math.floor(data.width / bits)
      let blocksizeY = Math.floor(data.height / bits)
      let result = []
      for (let y = 0; y < bits; y++) {
        for (let x = 0; x < bits; x++) {
          let total = 0
          for (let iy = 0; iy < blocksizeY; iy++) {
            for (let ix = 0; ix < blocksizeX; ix++) {
              let cx = x * blocksizeX + ix
              let cy = y * blocksizeY + iy
              let ii = (cy * data.width + cx) * 4

              let alpha = data.data[ii + 3]
              if (alpha === 0) {
                total += 765
              } else {
                total += data.data[ii] + data.data[ii + 1] + data.data[ii + 2]
              }
            }
          }
          result.push(total)
        }
      }
      let m = []
      for (let i = 0; i < 4; i++) {
        m[i] = median(result.slice(i * bits * bits / 4, i * bits * bits / 4 + bits * bits / 4))
      }
      for (let i = 0; i < bits * bits; i++) {
        if (((result[i] < m[0]) && (i < bits * bits / 4)) ||
          ((result[i] < m[1]) && (i >= bits * bits / 4) && (i < bits * bits / 2)) ||
          ((result[i] < m[2]) && (i >= bits * bits / 2) && (i < bits * bits / 4 + bits * bits / 2)) ||
          ((result[i] < m[3]) && (i >= bits * bits / 2 + bits * bits / 4))
        ) {
          result[i] = 0
        } else {
          result[i] = 1
        }
      }
      return bitsToHexhash(result)
    }
    let bmvbhash = function(data, bits) {
      let result = []
      let i, j, x, y
      let blockWidth, blockHeight
      let weightTop, weightBottom, weightLeft, weightRight
      let blockTop, blockBottom, blockLeft, blockRight
      let yMod, yFrac, yInt
      let xMod, xFrac, xInt
      let blocks = []
      let evenX = data.width % bits === 0
      let evenY = data.height % bits === 0
      if (evenX && evenY) {
        return bmvbhashEven(data, bits)
      }

      // initialize blocks array with 0s
      for (i = 0; i < bits; i++) {
        blocks.push([])
        for (j = 0; j < bits; j++) {
          blocks[i].push(0)
        }
      }

      blockWidth = data.width / bits
      blockHeight = data.height / bits

      for (y = 0; y < data.height; y++) {
        if (evenY) {
          // don't bother dividing y, if the size evenly divides by bits
          blockTop = blockBottom = Math.floor(y / blockHeight)
          weightTop = 1
          weightBottom = 0
        } else {
          yMod = (y + 1) % blockHeight
          yFrac = yMod - Math.floor(yMod)
          yInt = yMod - yFrac

          weightTop = (1 - yFrac)
          weightBottom = (yFrac)

          // yInt will be 0 on bottom/right borders and on block boundaries
          if (yInt > 0 || (y + 1) === data.height) {
            blockTop = blockBottom = Math.floor(y / blockHeight)
          } else {
            blockTop = Math.floor(y / blockHeight)
            blockBottom = Math.ceil(y / blockHeight)
          }
        }

        for (x = 0; x < data.width; x++) {
          let ii = (y * data.width + x) * 4

          let avgvalue
          let alpha = data.data[ii + 3]
          if (alpha === 0) {
            avgvalue = 765
          } else {
            avgvalue = data.data[ii] + data.data[ii + 1] + data.data[ii + 2]
          }

          if (evenX) {
            blockLeft = blockRight = Math.floor(x / blockWidth)
            weightLeft = 1
            weightRight = 0
          } else {
            xMod = (x + 1) % blockWidth
            xFrac = xMod - Math.floor(xMod)
            xInt = xMod - xFrac

            weightLeft = (1 - xFrac)
            weightRight = xFrac

            // xInt will be 0 on bottom/right borders and on block boundaries
            if (xInt > 0 || (x + 1) === data.width) {
              blockLeft = blockRight = Math.floor(x / blockWidth)
            } else {
              blockLeft = Math.floor(x / blockWidth)
              blockRight = Math.ceil(x / blockWidth)
            }
          }

          // add weighted pixel value to relevant blocks
          blocks[blockTop][blockLeft] += avgvalue * weightTop * weightLeft
          blocks[blockTop][blockRight] += avgvalue * weightTop * weightRight
          blocks[blockBottom][blockLeft] += avgvalue * weightBottom * weightLeft
          blocks[blockBottom][blockRight] += avgvalue * weightBottom * weightRight
        }
      }

      for (i = 0; i < bits; i++) {
        for (j = 0; j < bits; j++) {
          result.push(blocks[i][j])
        }
      }

      let m = []
      for (let i = 0; i < 4; i++) {
        m[i] = median(result.slice(i * bits * bits / 4, i * bits * bits / 4 + bits * bits / 4))
      }
      for (let i = 0; i < bits * bits; i++) {
        if (((result[i] < m[0]) && (i < bits * bits / 4)) ||
          ((result[i] < m[1]) && (i >= bits * bits / 4) && (i < bits * bits / 2)) ||
          ((result[i] < m[2]) && (i >= bits * bits / 2) && (i < bits * bits / 4 + bits * bits / 2)) ||
          ((result[i] < m[3]) && (i >= bits * bits / 2 + bits * bits / 4))
        ) {
          result[i] = 0
        } else {
          result[i] = 1
        }
      }

      return bitsToHexhash(result)
    }

    let blockhashData = function(imgData, bits, method) {
      let hash

      if (method === 1) {
        hash = bmvbhashEven(imgData, bits)
      } else if (method === 2) {
        hash = bmvbhash(imgData, bits)
      } else {
        throw new Error('Bad hashing method')
      }

      return hash
    }
    let data = {data: pixels, width: width, height: height}
    return blockhashData(data, 16, 1)
  }
}
