import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

let instance = (() => {
  const adapter = new FileSync('db.json')
  const db = lowdb(adapter)
  return {
    db: db,
    get: (key) => {
      return db.get(key).value()
    },
    set: (key, value) => {
      return db.set(key, value).write()
    },
    update: (key, value) => {
      if (db.has(key).value()) {
        return db.update(key, value).write()
      } else {
        return db.set(key, value).write()
      }
    },
    add: (key, value) => {
      if (db.has(key).value()) {
        let v = db.get(key).value()
        console.info(v)
      } else {
        return db.set(key, value).write()
      }
    }
  }
})()

export default {
  addImage: (obj) => {
    // 输入：{id: dhash, path: , filename: , keyword: []}
  },
  addImages: (objs) => {
    let db = instance.db
    for (let item of objs) {
      const k = 'images.' + item.id
      console.info(k)
      db.set(k, {
        label: item.label === undefined ? item.filename : item.label,
        path: item.path + '/' + item.filename,
        size: item.size,
        width: item.width,
        height: item.height,
        datetime: item.datetime
      }).write()
    }
    // db.write()
  },
  removeImage: (imageID) => {},
  updateImageTags: (imageID, tags) => {},
  changeImageName: (imageID, label) => {},
  hasDirectory: (path) => {
    let db = instance.db
    const paths = db.get('path').value()
    if (paths === undefined) return false
    for (let p of paths) {
      if (p === path) {
        return true
      }
    }
    return false
  },
  getImagesWithDirectoryFormat: () => {
    let db = instance.db
    const paths = db.get('path').value()
    const images = db.get('image').value()
    let directories = []
    for (let p in paths) {
      let children = []
      for (let identify of p) {
        children.push({label: images[identify].label})
      }
      directories.push({label: p, children: children})
    }
    return directories
  },
  findSimilarImage: (imageID) => {},
  findImageWithTags: (tags) => {},
  findImageWithKeyword: (keywords) => {}
}
