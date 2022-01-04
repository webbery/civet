/**
 * add style to root element. For exmaple:
 * <style id="root">
 * .class[data-cv-root] {...}
 * </style>
 */
class StyleLoader {
  #styles: Set<string> = new Set<string>();
  
  load(styles: string[], root: string) {
    if (this.#styles.has(root)) return
    let style = ''
    for (let idx = 0, len = styles.length; idx < len; ++idx) {
      style += this.addStyle(styles[idx], root) + '\n'
    }
    if (style.length) {
      let s = document.createElement('style')
      s.id = root
      s.innerHTML = style
      document.head.appendChild(s)
    }
    this.#styles.add(root)
  }

  private addStyle(style: string, root: string): string {
    if (style.indexOf('http') >= 0) {
      let link = document.createElement('link')
      // link.id 
      link.rel  = 'stylesheet'
      link.type = 'text/css'
      link.href = style
      document.head.appendChild(link)
      return ''
    }
    // add [data-cv-root]
    const regex = /([\.#]{0,1}[a-zA-Z_-]+)(:)*([a-zA-Z0-9\(\)-]*)( )*({[a-zA-Z0-9:;\s'%/* \(\),\-\.]*})/g
    const result = style.replace(regex, `$1[data-cv-${root}]$2$3$5`)
    // console.info('CSS:', result)
    return result
  }

  private clear(root: string) {
    const r = document.getElementById(root)
    if (!r) {
      console.warn(`style of ${root} not exist`)
      return
    }
    r.remove()
  }
}

export default new StyleLoader()