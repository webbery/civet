const NLP = (function () {
  let Segment = require('segment')
  let POSTAG = Segment.POSTAG
  let segment = new Segment()
  segment.useDefault()
  return {
    POSTAG: POSTAG,
    retrieveNoun: (str) => {
      let validNames = str.match(/[\u4e00-\u9fa5]+/g)
      let tags = new Set()
      if (validNames !== null) {
        const segs = segment.doSegment(validNames.join(''))
        console.info('SEGMENT: ', segs)
        for (let word of segs) {
          if (word.p & (POSTAG.D_N | POSTAG.A_NR | POSTAG.A_NS | POSTAG.A_NT)) {
            tags.add(word.w)
          }
        }
      }
      console.info('return SEGMENT: ', tags)
      return Array.from(tags)
    }
  }
})()

module.exports = NLP
// exports.getNouns = (str) => {
//   return NLP.retrieveNoun(str)
// }