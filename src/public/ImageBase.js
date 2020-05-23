export default class ImageBase {
  constructor(json) {
    this.id = json.id
    this.hash = json.hash || ''
    this.path = json.path
    this.filename = json.filename
    this.name = json.name || json.filename
    this.keyword = json.keyword
    this.size = json.size
    this.descsize = json.descsize || ''
    this.datetime = json.datetime
    this.width = json.width
    this.height = json.height
    this.thumbnail = json.thumbnail
    this.category = json.category || []
    this.type = json.type
    this.colors = json.colors || []
  }
}
