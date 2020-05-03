// import lowdb from 'lowdb'
// import FileSync from 'lowdb/adapters/FileSync'
import { SnapDB } from 'snap-db'
import JString from '@/../public/String'

let instance = (() => {
  const db = new SnapDB('data')
  db.isCompacting = process.env.NODE_ENV === 'development'
  // const adapter = new FileSync('db.json')
  // const db = lowdb(adapter)
  return {
    db: db,
    getOptional: async (key, defaultValue) => {
      let val = await db.get(key)
      if (val === undefined) return defaultValue
      else return JSON.parse(val)
    },
    query: async (key) => {
      return new Promise(function(resolve, reject) {
        db.query({keys: key}, (k, data) => {
          console.info(data)
        })
      })
    }
  }
})()

const KEY_IMAGES = 'images'
const KEY_PATHS = 'paths'
const KEY_TAGS = 'tags'

export default {
  addImage: (obj) => {
    // 输入：{id: dhash, path: , filename: , keyword: []}
  },
  addImages: async (objs) => {
    let db = instance.db
    let paths = await instance.getOptional(KEY_PATHS, {})
    console.info('addImages PATH:', paths)
    let images = await instance.getOptional(KEY_IMAGES, [])
    // console.info('addImages IMAGE:', images)
    // 标签索引
    let tags = await instance.getOptional(KEY_TAGS, {})
    for (let item of objs) {
      const k = item.id
      const dir = JString.replaceAll(item.path, '\\\\', '/')
      const fullpath = JString.joinPath(dir, item.filename)
      images.push(k)
      // console.info('size', item.size)
      db.put(k, JSON.stringify({
        label: item.filename,
        path: fullpath,
        size: item.size,
        width: item.width,
        height: item.height,
        datetime: item.datetime,
        type: item.type,
        thumbnail: item.thumbnail
      }))
      if (paths[dir] === undefined) {
        paths[dir] = []
      }
      paths[dir].push(k)
      for (let tag of item.keyword) {
        if (tags[tag] === undefined) {
          tags[tag] = []
        }
        tags[tag].push(k)
      }
    }
    // console.info(KEY_IMAGES)
    let imageSet = new Set(images)
    db.put(KEY_IMAGES, JSON.stringify(imageSet))

    // 路径文件排重
    for (let p in paths) {
      let files = new Set(paths[p])
      paths[p] = files
    }
    db.put(KEY_PATHS, JSON.stringify(paths))

    // 添加标签到数据库
    db.put(KEY_TAGS, JSON.stringify(tags))
  },
  getImageInfo: async (imageID) => {
    const image = await instance.getOptional(imageID, undefined)
    console.info('get info ', image)
    if (image === undefined) return null
    return image
  },
  removeImage: (imageID) => {},
  updateImageTags: (imageID, tags) => {},
  changeImageName: (imageID, label) => {},
  hasDirectory: async (path) => {
    const paths = await instance.getOptional(KEY_PATHS, undefined)
    console.info(paths)
    if (paths === undefined) return false
    for (let p of paths) {
      if (p === path) {
        return true
      }
    }
    return false
  },
  getImagesWithDirectoryFormat: async () => {
    let paths = await instance.getOptional(KEY_PATHS, undefined)
    // console.info('path', paths)
    if (paths === undefined) return []
    let directories = []
    for (let p in paths) {
      let children = []
      for (let identify of paths[p]) {
        const image = await instance.getOptional(identify, null)
        console.info(image)
        children.push({label: image.label, id: identify})
      }
      directories.push({label: p, children: children})
    }
    console.info(directories)
    return directories
  },
  getTags: async () => {
    let tagsID = await instance.getOptional(KEY_TAGS, {})
    let tags = []
    for (let tag in tagsID) {
      tags.push(tag)
    }
    console.info('tags: ', tags)
    return tags
  },
  findSimilarImage: (imageID) => {},
  findImageWithTags: (tags) => {},
  findImageWithKeyword: (keywords) => {}
}
