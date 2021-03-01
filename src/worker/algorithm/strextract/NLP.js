const NLP = (function () {
  const Segment = require('segment')
  const POSTAG = Segment.POSTAG
  const segment = new Segment()
  segment.useDefault()
  return {
    POSTAG: POSTAG,
    retrieveNoun: (str) => {
      const validNames = str.match(/[\u4e00-\u9fa5]+/g)
      const tags = new Set()
      if (validNames !== null) {
        const segs = segment.doSegment(validNames.join(''))
        console.info('SEGMENT: ', segs)
        for (const word of segs) {
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

export default {
  getNouns: NLP.retrieveNoun
}
// module.exports = NLP
// exports.getNouns = (str) => {
//   return NLP.retrieveNoun(str)
// }
