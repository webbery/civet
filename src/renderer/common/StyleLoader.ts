class StyleLoader {
  load(styles: string[]) {
    for (let idx = 0, len = styles.length; idx < len; ++idx) {
      this.addStyle(styles[idx])
    }
  }

  private addStyle(style: string) {
    console.info('style:', style)
    if (style.indexOf('http') >= 0) {
      let link = document.createElement('link')
      // link.id 
      link.rel  = 'stylesheet'
      link.type = 'text/css'
      link.href = style
      document.getElementsByTagName('head').item(0)?.appendChild(link)
    } else {
      let s = document.createElement('style')
      s.type = 'text/css'
      s.innerHTML = style
      document.getElementsByTagName('head').item(0)?.appendChild(s)
    }
  }
}

export default new StyleLoader()