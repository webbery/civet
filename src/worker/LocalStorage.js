// import lowdb from 'lowdb'
// import FileSync from 'lowdb/adapters/FileSync'
import JString from '../public/String'
import NLP from '../public/NLP'
// import logger from './Logger'

// 数据库版本
const DBVersion = 1

// 表名
const TablePath = 'path'
// const TableImage = 'image'
const TableImageIndexes = 'image_index'
const TableTAG = 'tag'
const TableWord2Index = 'word2index'
const TableIndex2Word = 'index2word'
const TableRewordIndex = 'reword_index'
const TableHash = 'hash'

// KEY
const KeyPath = 'v' + DBVersion + '.' + TablePath
// const KeyImage = 'v' + DBVersion + '.' + TableImage
const KeyImageIndexes = 'v' + DBVersion + '.' + TableImageIndexes
const KeyTag = 'v' + DBVersion + '.' + TableTAG
const KeyWord2Index = 'v' + DBVersion + '.' + TableWord2Index
const KeyIndex2Word = 'v' + DBVersion + '.' + TableIndex2Word
const KeyRewordIndex = 'v' + DBVersion + '.' + TableRewordIndex
const KeyID = 'v' + DBVersion + '.id'
const KeyHash = 'v' + DBVersion + '.' + TableHash

let instance = (() => {
  const levelup = require('levelup')
  const leveldown = require('leveldown')
  // const rocksdb = require('rocksdb')
  var db
  // let options = {'prefix_extractor': }
  const {remote} = require('electron')
  let userDir = remote.app.getPath('userData')
  const dbName = (remote.app.isPackaged ? userDir + '/civet' : 'civet')
  console.info('======', dbName, '======')
  return function() {
    return db || (db = levelup(leveldown(dbName)))
  }
})()

// 10进制转36进制
const conv36 = (v) => {
  const val = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  let ret = ''
  let cond = v
  do {
    let r = cond % val.length
    ret = val[r] + ret
    cond = (cond - r) / val.length
  } while (cond > 0)
  return ret
}

// 图片ID采用5位自增式,使用0~9,a~z共36个符号
// 增加一个回收ID表
const IDGenerator = (function () {
  // 初始化从数据库获取最后数值(10进制)
  let startID = 0
  const init = async () => {
    if (startID === 0) {
      startID = await getOptional(KeyID, 0)
    }
    return startID
  }
  // 退出时最后数值写入数据库
  const release = async () => {
    await put(KeyID, startID)
  }

  return {
    getID: async () => {
      await init()
      startID += 1
      put(KeyID, startID)
      return conv36(startID)
    },
    release: release
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

async function getKeywordIndx(keywords) {
  let keyword2index = await getOptional(KeyWord2Index, {})
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
  console.info('keyword2index', keyword2index, wordIndx)
  if (shouldUpdate === true) {
    put(KeyWord2Index, keyword2index)

    let index2keyword = await getOptional(KeyIndex2Word, {})
    for (let k in index2word) {
      index2keyword[k] = index2word[k]
    }
    put(KeyIndex2Word, index2keyword)
  }
  return wordIndx
}

async function getKeyword(indexes) {
  let indx2word = await getOptional(KeyIndex2Word, null)
  if (indx2word === null) return null
  let words = []
  for (let idx of indexes) {
    if (idx !== null) {
      words.push(indx2word[idx.toString()])
    }
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

async function getImageInfoImpl(imageID) {
  let image = await getOptional(imageID, null)
  console.info('image', image, imageID)
  if (image.tag !== null) {
    const tagsName = await getKeyword(image.tag)
    image.tag = tagsName
  }
  image.id = imageID
  return image
}
export default {
  generateID: async () => {
    return IDGenerator.getID()
  },
  addImage: (obj) => {
    // 输入：{id: dhash, path: , filename: , keyword: []}
  },
  addImages: async (objs) => {
    let paths = await getOptional(KeyPath, {})
    console.info('addImages PATH:', paths)
    let images = await getOptional(KeyImageIndexes, [])
    // console.info('addImages IMAGE:', images)
    // 标签索引
    let tags = await getOptional(KeyTag, {})
    let rewordIndx = await getOptional(KeyRewordIndex, {})
    let simhash = await getOptional(KeyHash, {})
    for (let item of objs) {
      const k = item.id
      // console.info('image key', k)
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
      paths[dir] = pushArray(paths[dir], k)
      simhash[item.hash] = pushArray(simhash[item.hash], k)
      for (let tagIndx of kwIndx) {
        // console.info('tagIndx', tagIndx)
        tags[tagIndx.toString()] = pushArray(tags[tagIndx.toString()], k)
        rewordIndx[tagIndx.toString()] = pushArray(rewordIndx[tagIndx.toString()], k)
      }
    }
    // console.info(KEY_IMAGES)
    // let imageSet = new Set(images)
    put(KeyImageIndexes, images)

    // 路径文件排重
    for (let p in paths) {
      let files = new Set(paths[p])
      paths[p] = files
    }
    put(KeyPath, paths)

    // 添加标签到数据库
    console.info('write tags:', tags)
    put(KeyTag, tags)

    // 构建倒排索引 [词编号: 图像ID]
    console.info('reword index:', rewordIndx)
    put(KeyRewordIndex, rewordIndx)
    // 保存局部敏感hash[hash: 图像ID]
    put(KeyHash, simhash)
  },
  getImageInfo: (imageID) => {
    console.info('imageID', imageID)
    return getImageInfoImpl(imageID)
  },
  getImagesInfo: async (imagesID) => {
    let images = []
    console.info('logger.info')
    for (let ids of imagesID) {
      let image = await getImageInfoImpl(ids)
      images.push(image)
    }
    return images
  },
  getImagesIndex: async () => {
    let imagesIndex = await getOptional(KeyImageIndexes, [])
    console.info('all images id', imagesIndex)
    return imagesIndex
  },
  removeImage: (imageID) => {},
  updateImageTags: (imageID, tags) => {},
  changeImageName: (imageID, label) => {},
  hasDirectory: async (path) => {
    const paths = await getOptional(KeyPath, undefined)
    if (paths === undefined) return false
    for (let p of paths) {
      if (p === path) {
        return true
      }
    }
    return false
  },
  getImagesWithDirectoryFormat: async () => {
    let paths = await getOptional(KeyPath, undefined)
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
    // console.info(KeyTag)
    let tagIDs = await getOptional(KeyTag, {})
    let tags = {}
    const words = await getKeyword(Object.keys(tagIDs))
    // console.info('words', words, 'tags', tagIDs[1].length)
    for (let idx in words) {
      let py = NLP.getFirstLetter(words[idx])
      if (tags[py[0]] === undefined) tags[py[0]] = []
      // console.info('tag idx', idx + 1, tagIDs[(parseInt(idx) + 1)])
      tags[py[0]].push(words[idx] + ' ' + tagIDs[(parseInt(idx) + 1)].length)
    }
    console.info('tags: ', tags)
    return tags
  },
  addTag: async (imageID, tag) => {
    let tagIDs = await getOptional(KeyTag, {})
    let indx = await getKeywordIndx([tag])
    const tagID = indx[0]
    // console.info('tag index:', indx)
    if (tagIDs[tagID] === undefined) tagIDs[tagID] = []
    tagIDs[tagID].push(imageID)

    let image = await getOptional(imageID, null)
    image.tag.push(tagID)
    image.keyword.push(tagID)
    // console.info('----------', image)

    let rewordIndex = await getOptional(KeyRewordIndex, {})
    if (rewordIndex[tagID] === undefined) rewordIndex[tagID] = []
    rewordIndex[tagID].push(imageID)

    let data = {}
    data[KeyTag] = tagIDs
    data[imageID] = image
    data[KeyRewordIndex] = rewordIndex
    batchPut(data)
  },
  removeTag: async (tag, imageID) => {
    let image = await getOptional(imageID, null)
    let indx = await getKeywordIndx([tag])
    const tagID = indx[0]
    // 更新tag/keyword/倒排索引
    image.tag.splice(image.tag.findIndex(e => e === tagID, 1))
    image.keyword.splice(image.keyword.findIndex(e => e === tagID, 1))
    // console.info(image)
    let rewordIndex = await getOptional(KeyRewordIndex, {})
    rewordIndex[tagID].splice(rewordIndex[tagID].findIndex(e => e === imageID), 1)

    let tagIDs = await getOptional(KeyTag, {})
    tagIDs[tagID].splice(tagIDs[tagID].findIndex(e => e === imageID), 1)

    let data = {}
    data[KeyTag] = tagIDs
    data[imageID] = image
    data[KeyRewordIndex] = rewordIndex
    batchPut(data)
  },
  findSimilarImage: (imageID) => {},
  findImageWithTags: (tags) => {},
  findImageWithKeyword: async (keywords) => {
    let indx = await getKeywordIndx(keywords)
    console.info(indx)
    let rewordIndx = await getOptional(KeyRewordIndex, {})
    console.info('rewordIndx', rewordIndx)
    let imageIDs = []
    for (let idx of indx) {
      console.info(idx)
      imageIDs = imageIDs.concat(rewordIndx[idx])
    }
    console.info('imageIDs', imageIDs)
    return imageIDs
  },
  release: async () => {
    await IDGenerator.release()
  }
}
