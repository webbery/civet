// import lowdb from 'lowdb'
// import FileSync from 'lowdb/adapters/FileSync'
import JString from '@/../public/String'

let instance = (() => {
  const levelup = require('levelup')
  const leveldown = require('leveldown')
  var db
  // db.isCompacting = process.env.NODE_ENV === 'development'
  return function() {
    return db || (db = levelup(leveldown('civet.db')))
  }
})()

async function getOptional(key, defaultValue) {
  try {
    let val = await instance().get(key)
    // console.info('getOtional', val)
    if (val === undefined) return defaultValue
    else return JSON.parse(val)
  } catch (err) {
    // val = String.fromCharCode.apply(null, val)
    console.log(err)
    return defaultValue
  }
}

async function put(key, value) {
  try {
    await instance().put(key, JSON.stringify(value))
  } catch (err) {
    console.log('put data error: [key=', key, ', value=', value, ']', err)
  }
}

async function batchPut(data) {
  try {
    let batchData = []
    for (let indx in data) {
      batchData.push({
        type: 'put',
        key: indx,
        value: JSON.stringify(data[indx])
      })
    }
    await instance().batch(batchData)
  } catch (err) {
    console.log(err)
  }
}

const KEY_IMAGES = 'images'
const KEY_PATHS = 'paths'
const KEY_TAGS = 'tags'

export default {
  addImage: (obj) => {
    // 输入：{id: dhash, path: , filename: , keyword: []}
  },
  addImages: async (objs) => {
    let paths = await getOptional(KEY_PATHS, {})
    console.info('addImages PATH:', paths)
    let images = await getOptional(KEY_IMAGES, [])
    // console.info('addImages IMAGE:', images)
    // 标签索引
    let tags = await getOptional(KEY_TAGS, {})
    for (let item of objs) {
      const k = item.id
      const dir = JString.replaceAll(item.path, '\\\\', '/')
      const fullpath = JString.joinPath(dir, item.filename)
      images.push(k)
      // console.info('size', item.size)
      instance().put(k, JSON.stringify({
        label: item.filename,
        path: fullpath,
        size: item.size,
        width: item.width,
        height: item.height,
        datetime: item.datetime,
        type: item.type,
        thumbnail: item.thumbnail,
        tag: item.keyword
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
    put(KEY_IMAGES, imageSet)

    // 路径文件排重
    for (let p in paths) {
      let files = new Set(paths[p])
      paths[p] = files
    }
    put(KEY_PATHS, paths)

    // 添加标签到数据库
    console.info('write tags:', tags)
    put(KEY_TAGS, tags)
  },
  getImageInfo: async (imageID) => {
    let image = await getOptional(imageID, null)
    return image
  },
  removeImage: (imageID) => {},
  updateImageTags: (imageID, tags) => {},
  changeImageName: (imageID, label) => {},
  hasDirectory: async (path) => {
    const paths = await getOptional(KEY_PATHS, undefined)
    // await instance().put('4278916d83fccf02650fb793d998de89', 'hello world')
    await instance().put('hello', 'hello world')
    const value = await getOptional('hello', undefined)
    console.info('++++++++++', value, paths)
    if (paths === undefined) return false
    for (let p of paths) {
      if (p === path) {
        return true
      }
    }
    return false
  },
  getImagesWithDirectoryFormat: async () => {
    let paths = await getOptional(KEY_PATHS, undefined)
    console.info('path', paths)
    if (paths === undefined) return []
    let directories = []
    for (let p in paths) {
      let children = []
      for (let identify of paths[p]) {
        console.info('key', typeof identify)
        const image = await getOptional(identify, null)
        console.info('image', image)
        if (image === null) continue
        children.push({label: image.label, id: identify})
      }
      directories.push({label: p, children: children})
    }
    console.info(directories)
    return directories
  },
  getTags: async () => {
    // 倒排索引{标签: [图片ID]}
    let tagIDs = await getOptional(KEY_TAGS, {})
    let tags = {}
    for (let tag in tagIDs) {
      let py = JString.getFirstLetter(tag)
      if (tags[py[0]] === undefined) tags[py[0]] = []
      tags[py[0]].push(tag)
    }
    console.info('tags: ', tags)
    return tags
  },
  addTag: async (imageID, tag) => {
    let tagIDs = await getOptional(KEY_TAGS, {})
    if (tagIDs[tag] === undefined) tagIDs[tag] = []
    tagIDs[tag].push(imageID)

    let image = await getOptional(imageID, null)
    image.tag.push(tag)

    let data = {}
    data[KEY_TAGS] = tagIDs
    data[imageID] = image
    batchPut(data)
  },
  findSimilarImage: (imageID) => {},
  findImageWithTags: (tags) => {},
  findImageWithKeyword: (keywords) => {}
}
