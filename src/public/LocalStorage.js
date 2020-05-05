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

const KEY_IMAGES = 'images'
const KEY_PATHS = 'paths'
const KEY_TAGS = 'tags'
const KEY_WORDS2INDEX = 'words2index'
const KEY_INDEX2WORD = 'index2word'
const KEY_REWORD_INDEX = 'reword_index'

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

async function getKeywordIndx(keywords) {
  let keyword2index = await getOptional(KEY_WORDS2INDEX, {})
  let maxIndx = Object.keys(keyword2index).length + 1
  let wordIndx = []
  let shouldUpdate = false
  let index2word = {}
  for (let word of keywords) {
    if (keyword2index[word] === undefined) {
      keyword2index[word] = maxIndx
      index2word[maxIndx.toString()] = word
      maxIndx += 1
      shouldUpdate = true
    }
    wordIndx.push(keyword2index[word])
  }
  if (shouldUpdate === true) {
    put(KEY_WORDS2INDEX, keyword2index)

    let index2keyword = await getOptional(KEY_INDEX2WORD, {})
    for (let k in index2word) {
      index2keyword[k] = index2word[k]
    }
    put(KEY_INDEX2WORD, index2keyword)
  }
  return wordIndx
}

async function getKeyword(indexes) {
  let indx2word = await getOptional(KEY_INDEX2WORD, null)
  if (indx2word === null) return null
  let words = []
  for (let idx of indexes) {
    words.push(indx2word[idx.toString()])
  }
  return words
}

function getOrCreateArray(obj) {
  if (obj === undefined) obj = []
  return obj
}

function pushArray(array, data) {
  array = getOrCreateArray(array)
  array.push(data)
  return array
}
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
    let rewordIndx = await getOptional(KEY_REWORD_INDEX, {})
    for (let item of objs) {
      const k = item.id
      const dir = JString.replaceAll(item.path, '\\\\', '/')
      const fullpath = JString.joinPath(dir, item.filename)
      images.push(k)
      const kwIndx = await getKeywordIndx(item.keyword)
      instance().put(k, JSON.stringify({
        label: item.filename,
        path: fullpath,
        size: item.size,
        width: item.width,
        height: item.height,
        datetime: item.datetime,
        type: item.type,
        thumbnail: item.thumbnail,
        tag: kwIndx,
        keyword: kwIndx
      }))
      if (paths[dir] === undefined) {
        paths[dir] = []
      }
      paths[dir].push(k)
      for (let tagIndx of kwIndx) {
        tags[tagIndx.toString()] = pushArray(tags[tagIndx.toString()], k)
        rewordIndx[tagIndx.toString()] = pushArray(rewordIndx[tagIndx.toString()], k)
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

    // 构建倒排索引 [词编号: 图像ID]
    put(KEY_REWORD_INDEX, rewordIndx)
  },
  getImageInfo: async (imageID) => {
    let image = await getOptional(imageID, null)
    return image
  },
  getImagesInfo: async (imagesID) => {
    let images = []
    for (let ids of imagesID) {
      let image = await getOptional(ids, null)
      images.push(image)
    }
    return images
  },
  removeImage: (imageID) => {},
  updateImageTags: (imageID, tags) => {},
  changeImageName: (imageID, label) => {},
  hasDirectory: async (path) => {
    const paths = await getOptional(KEY_PATHS, undefined)
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
    if (paths === undefined) return []
    let directories = []
    for (let p in paths) {
      let children = []
      for (let identify of paths[p]) {
        const image = await getOptional(identify, null)
        if (image === null) continue
        children.push({label: image.label, id: identify})
      }
      directories.push({label: p, children: children})
    }
    console.info(directories)
    return directories
  },
  getTags: async () => {
    // 倒排索引 {标签: [图片ID]}
    let tagIDs = await getOptional(KEY_TAGS, {})
    let tags = {}
    const words = await getKeyword(Object.keys(tagIDs))
    console.info('words', words)
    for (let idx in words) {
      let py = JString.getFirstLetter(words[idx])
      if (tags[py[0]] === undefined) tags[py[0]] = []
      tags[py[0]].push(words[idx] + ' ' + tagIDs[idx].length)
    }
    console.info('tags: ', tags)
    return tags
  },
  addTag: async (imageID, tag) => {
    let tagIDs = await getOptional(KEY_TAGS, {})
    let indx = await getKeywordIndx([tag])
    if (tagIDs[indx.toString()] === undefined) tagIDs[indx.toString()] = []
    tagIDs[indx.toString()].push(imageID)

    let image = await getOptional(imageID, null)
    image.tag.push(tag)

    let data = {}
    data[KEY_TAGS] = tagIDs
    data[imageID] = image
    batchPut(data)
  },
  findSimilarImage: (imageID) => {},
  findImageWithTags: (tags) => {},
  findImageWithKeyword: async (keywords) => {
    let indx = await getKeywordIndx(keywords)
    let rewordIndx = await getOptional(KEY_REWORD_INDEX, {})
    let imageIDs = []
    for (let idx of indx) {
      imageIDs = imageIDs.concat(rewordIndx[idx])
    }
    return imageIDs
  }
}
