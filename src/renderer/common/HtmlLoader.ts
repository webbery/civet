class HtmlLoader {
  #TAG_REGEX: RegExp = new RegExp(/(<(\"[^\"]*\"|\'[^\']*\'|[^\'\"/>])*)>/g);
  #htmls: Map<string, MutationObserver>;

  load(body: string, root: string): string {
    if (!body) return ''
    const result = body.replace(this.#TAG_REGEX, `$1 data-cv-${root}>`)
    console.info('html load:', result)
    return result
  }

  injector(root: string) {
    if (!this.#htmls) {
      this.#htmls = new Map<string, MutationObserver>()
    }
    if (!this.#htmls.has(root)) {
      // inject intercept
      const node = document.getElementById(root)
      if (!node) {
        console.error(`html of ${root} is not exist`)
        return
      }
      const config = { childList: true, subtree: true }
      const callback = function(mutationsList: any, observer: any) {
        console.debug('MutationObserver')
      }
      const observer = new MutationObserver(callback)
      observer.observe(node, config)
      this.#htmls.set(root, observer)
    }
  }
  outjector(root: string) {
    if (this.#htmls.has(root)) {
      const node = document.getElementById(root)
      if (!node) {
        console.error(`html of ${root} is not exist`)
        return
      }
      const observer = this.#htmls.get(root)
      observer!.disconnect()
      this.#htmls.delete(root)
    }
  }
}

export default new HtmlLoader()
