import pinyin from 'pinyin'

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
        console.info('SEGMENT: ', segs)
        for (let word of segs) {
          if (word.p & (POSTAG.D_N | POSTAG.A_NR | POSTAG.A_NS | POSTAG.A_NT)) {
            tags.push(word.w)
          }
        }
      }
      console.info('return SEGMENT: ', tags)
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
  getFormatType: (str) => {
    const start = str.indexOf('/')
    if (start > 0) {
      const name = str.substring(start + 1)
      return name
    } else {
      const name = str.substring(str.indexOf('.') + 1)
      return name
    }
  },
  isImage: (filename) => {
    filename = filename.toLowerCase()
    if (filename.indexOf('.jpg') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.png') > 0 ||
      filename.indexOf('.jpeg') > 0 || filename.indexOf('.gif') > 0 || filename.indexOf('.tiff') > 0) {
      return true
    }
    return false
  },
  replaceAll: (str, s1, s2) => {
    // return str.replace(s1, s2)
    return str.replace(new RegExp(s1, 'gm'), s2)
  },
  joinPath: (root, path) => {
    let newPath = root.replace(/\\/g, '/')
    let last = newPath[newPath.length - 1]
    console.info(newPath)
    if (last !== '/') {
      root += '/'
    }
    root += path
    return root
  },
  getFirstLetter: (cn) => {
    return pinyin(cn, {
      heteronym: true,
      segment: true,
      style: pinyin.STYLE_FIRST_LETTER
    })
  }
}
