import crypto from 'crypto'

class StyleLoader {
  #styles: Map<string, any> = new Map<string, any>();
  
  load(styles: string[]) {
    this.clear()
    for (let idx = 0, len = styles.length; idx < len; ++idx) {
      this.addStyle(styles[idx])
    }
  }

  private addStyle(style: string) {
    // console.info('style:', style)
    const md5 = crypto.createHash('md5')
    const hash = md5.update(style).digest('base64')
    if (this.#styles[hash] !== undefined) return
    if (style.indexOf('http') >= 0) {
      let link = document.createElement('link')
      // link.id 
      link.rel  = 'stylesheet'
      link.type = 'text/css'
      link.href = style
      document.head.appendChild(link)
      this.#styles[hash] = link
    } else {
      let s = document.createElement('style')
      s.type = 'text/css'
      s.innerHTML = style
      document.head.appendChild(s)
      this.#styles[hash] = s
    }
  }

  private clear() {
    // for (let style of this.#styles) {
    //   // document.head.removeChild(style)
    //   style.parentNode.removeChild(style)
    // }
  }
}

export default new StyleLoader()