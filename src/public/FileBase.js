export default class FileBase {
  constructor(json) {
    this.id = json.id || json.fileid
    this.meta = json.meta || []
    this.keyword = json.keyword || []
    this.category = json.category || []
    this.tag = json.tag || []
    for (let item of json.meta) {
      console.info(item)
      this[item['name']] = item['value']
    }
  }

  addMeta(typename, value) {
    if (!this[typename]) {
      const meta = { name: typename, value: value, type: this.metaType(value) }
      this.meta.push(meta)
    } else {
      for (let item of this.meta) {
        if (item['name'] === typename) {
          item['value'] = value
          break
        }
      }
    }
    this[typename] = value
  }

  metaType(value) {
    if (typeof value === 'number') return 'value'
    if (value[0] === '#') return 'value'
    return 'str'
  }
}
