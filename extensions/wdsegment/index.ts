
class Segmentor {
  private _segment: any;
  private _POSTAG: any;

  constructor() {
    const Segment = require('segment')
    this._POSTAG = Segment.POSTAG
    this._segment = new Segment()
    this._segment.useDefault()
  }

  retrieveNoun(content: string): string[] {
    const validNames = content.match(/[\u4e00-\u9fa5]+/g)
    const tags = new Set()
    if (validNames !== null) {
      const segs = this._segment.doSegment(validNames.join(''))
      for (const word of segs) {
        if (word.p & (this._POSTAG.D_N | this._POSTAG.A_NR | this._POSTAG.A_NS | this._POSTAG.A_NT)) {
          tags.add(word.w)
        }
      }
    }
    console.info('return SEGMENT: ', tags)
    return <string[]>Array.from(tags)
  }
}

export function activate() {
  console.info('I\'m activated!')
  let segment = new Segmentor()
  return {
    read: (filepath: string, resource: any) => {
      // const fs = require('fs')
      resource.tag = segment.retrieveNoun(filepath)
      if (resource.tag.length > 0) {
        resource.keyword = resource.tag
      }
      // console.info('segment:', filepath, resource)
      return true
    }
  }
}
