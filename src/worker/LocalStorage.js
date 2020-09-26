// import lowdb from 'lowdb'
// import FileSync from 'lowdb/adapters/FileSync'
import JString from '../public/String'
import NLP from '../public/NLP'
// import log from '../public/Logger'
import Storage from '../public/Kernel'

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
// const TableHash = 'hash'
const TableCategory2Index = 'category2index'
const TableIndex2Category = 'index2category'
const TableCategory = 'category'
const TableUnCategory = 'uncategory'
const TableUnTag = 'untag'

// KEY
const KeyPath = 'v' + DBVersion + '.' + TablePath
// const KeyImage = 'v' + DBVersion + '.' + TableImage
const KeyImageIndexes = 'v' + DBVersion + '.' + TableImageIndexes
const KeyTag = 'v' + DBVersion + '.' + TableTAG
const KeyUnTag = 'v' + DBVersion + '.' + TableUnTag
const KeyWord2Index = 'v' + DBVersion + '.' + TableWord2Index
const KeyIndex2Word = 'v' + DBVersion + '.' + TableIndex2Word
const KeyRewordIndex = 'v' + DBVersion + '.' + TableRewordIndex
const KeyID = 'v' + DBVersion + '.id'
// const KeyHash = 'v' + DBVersion + '.' + TableHash
const KeyCategory2Index = 'v' + DBVersion + '.' + TableCategory2Index
const KeyIndex2Category = 'v' + DBVersion + '.' + TableIndex2Category
const KeyCategory = 'v' + DBVersion + '.' + TableCategory
const KeyUnCategory = 'v' + DBVersion + '.' + TableUnCategory

function initDB(dbpath) {
  // const levelup = require('levelup')
  // const leveldown = require('leveldown')
  // const rocksdb = require('rocksdb')
  var db
  let dbname = ''
  if (!dbpath) {
    const {remote} = require('electron')
    const fs = require('fs')
    const userDir = remote.app.getPath('userData')
    const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
    const config = JSON.parse(fs.readFileSync(configPath))
    dbname = config.db.path
    if (config.db.version !== undefined) {
      // 检查是否需要升级数据库
      if (DBVersion > config.db.version) {}
    }
  } else {
    dbname = dbpath
  }
  Storage.init(config)
  console.info('======', dbname, '======')
  return function() {
    return Storage
    // return db || (db = levelup(leveldown(dbname)))
  }
}
let instance = initDB()

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

async function del(key) {
  try {
    await instance().del(key)
  } catch (err) {
    console.log(err)
  }
}
async function getKeywordIndx(keywords) {
  let wordIndx = []
  if (keywords === undefined || keywords.length === 0) return wordIndx
  let keyword2index = await getOptional(KeyWord2Index, {})
  let maxIndx = Object.keys(keyword2index).length + 1
  let shouldUpdate = false
  let index2word = {}
  console.info('getKeywordIndx', keywords)
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
    await put(KeyWord2Index, keyword2index)

    let index2keyword = await getOptional(KeyIndex2Word, {})
    for (let k in index2word) {
      index2keyword[k] = index2word[k]
    }
    await put(KeyIndex2Word, index2keyword)
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
  if (image === null) return null
  // tag
  if (image.tag != null) {
    const tagsName = await getKeyword(image.tag)
    image.tag = tagsName
  }
  if (image.keyword != null) {
    const keywords = await getKeyword(image.keyword)
    image.keyword = keywords
  }
  image.id = imageID
  // category
  if (image.category) {
    const indx2cate = await getOptional(KeyIndex2Category, {})
    // console.info('KeyIndex2Category', indx2cate, image.category)
    let category = []
    for (let code of image.category) {
      const chain = await code2categoryChain(code, indx2cate)
      category.push(chain)
    }
    image.category = category
  }
  return image
}

async function categoryChain2code(chain, cate2indx, indx2cate) {
  // 将文本序列编码,如：文件夹1.子文件夹 --> 3.2
  console.info('chain', chain)
  let categoryName = chain.split('/')
  if (!cate2indx) {
    cate2indx = await getOptional(KeyCategory2Index, {})
  }
  // console.info('cate2indx', cate2indx)
  if (!indx2cate) {
    indx2cate = await getOptional(KeyIndex2Category, {})
  }
  let maxID = Object.keys(cate2indx).length + 1
  let sCode = ''
  for (let name of categoryName) {
    // console.info('add', name)
    if (!name || name === '') continue
    if (cate2indx[name] === undefined) {
      cate2indx[name] = maxID
      indx2cate[maxID] = name
      await put(KeyIndex2Category, indx2cate)
      await put(KeyCategory2Index, cate2indx)
      maxID += 1
    }
    sCode += cate2indx[name] + '/'
  }
  return sCode.substr(0, sCode.length - 1)
}

async function code2categoryChain(code, indx2cate) {
  let categoryIDs = code.split('/')
  if (!indx2cate) {
    indx2cate = await getOptional(KeyIndex2Category, {})
  }

  let chain = ''
  for (let idx of categoryIDs) {
    chain += indx2cate[idx] + '/'
  }
  return chain.substr(0, chain.length - 1)
}

function makeCategoryChain(categoryName, categoryChain) {
  let chain = categoryName
  if (categoryChain !== undefined && categoryChain !== '') chain = categoryChain + '/' + categoryName
  return chain
}

export default {
  reloadDB: (dbpath) => {
    instance = initDB(dbpath)
  },
  generateID: async () => {
    return IDGenerator.getID()
  },
  addImages: async (objs) => {
    let paths = await getOptional(KeyPath, {})
    let images = await getOptional(KeyImageIndexes, {})
    // console.info('addImages IMAGE:', images)
    // 标签索引
    // let tags = await getOptional(KeyTag, {})
    // let rewordIndx = await getOptional(KeyRewordIndex, {})
    // let simhash = await getOptional(KeyHash, {})
    let uncategory = await getOptional(KeyUnCategory, [])
    let untags = await getOptional(KeyUnTag, [])
    for (let item of objs) {
      const k = item.id
      // console.info('image key', k)
      const dir = JString.replaceAll(item.path, '\\\\', '/')
      const fullpath = JString.joinPath(dir, item.filename)
      images[k] = {name: item.filename, step: 0}
      uncategory.push(k)
      untags.push(k)
      await instance().put(k, JSON.stringify({
        label: item.filename,
        path: fullpath,
        size: item.size,
        width: item.width,
        height: item.height,
        datetime: item.datetime,
        type: item.type,
        thumbnail: item.thumbnail
      }))
      paths[dir] = pushArray(paths[dir], k)
      // simhash[item.hash] = pushArray(simhash[item.hash], k)
      // for (let tagIndx of kwIndx) {
      //   // console.info('tagIndx', tagIndx)
      //   tags[tagIndx.toString()] = pushArray(tags[tagIndx.toString()], k)
      //   rewordIndx[tagIndx.toString()] = pushArray(rewordIndx[tagIndx.toString()], k)
      // }
    }
    // console.info(KEY_IMAGES)
    // let imageSet = new Set(images)
    await put(KeyImageIndexes, images)
    await put(KeyUnCategory, uncategory)
    await put(KeyUnTag, untags)

    // 路径文件排重
    for (let p in paths) {
      let files = new Set(paths[p])
      paths[p] = files
    }
    await put(KeyPath, paths)
  },
  updateImageTags: async (imageID, tags) => {
    // 标签索引
    let img = await getOptional(imageID, null)
    // console.info('update tags', tags)
    const tagIndxes = await getKeywordIndx(tags)
    console.info('tagIndexes', tagIndxes, img.keyword)
    img.tag = tagIndxes
    if (img.keyword !== undefined) {
      img.keyword = tagIndxes.concat(img.keyword)
    } else {
      img.keyword = tagIndxes
    }
    await put(imageID, img)

    let allTags = await getOptional(KeyTag, {})
    let unTags = await getOptional(KeyUnTag, [])
    let rewordIndx = await getOptional(KeyRewordIndex, {})

    console.info('img.keyword', img.keyword)
    for (let tagIndx of img.keyword) {
      // console.info('tagIndx', tagIndx)
      allTags[tagIndx.toString()] = pushArray(allTags[tagIndx.toString()], imageID)
      rewordIndx[tagIndx.toString()] = pushArray(rewordIndx[tagIndx.toString()], imageID)
    }
    await put(KeyTag, allTags)
    unTags.remove(imageID)
    await put(KeyUnTag, unTags)
    // 构建倒排索引 [词编号: 图像ID]
    console.info('reword index:', rewordIndx)
    await put(KeyRewordIndex, rewordIndx)
  },
  nextStep: async (imageID) => {
    let images = await getOptional(KeyImageIndexes, {})
    // console.info('nextStep', imageID, images)
    images[imageID].step += 1
    await put(KeyImageIndexes, images)
  },
  undateImage: async (imageID, name, subdata, step) => {
    let images = await getOptional(KeyImageIndexes, {})
    if (images[imageID].step < step) {
      let image = await getOptional(imageID, null)
      image[name] = subdata
      images[imageID].step = step
      put(KeyImageIndexes, images)
      put(imageID, image)
    }
  },
  updateImageCatergory: async (imageID, category) => {
    console.info(category)
    // 更新图像的分类
    let img = await getOptional(imageID, null)
    let cate2indx = await getOptional(KeyCategory2Index, {})
    let indx2cate = await getOptional(KeyIndex2Category, {})
    let categoryID = []
    let words = []
    for (let item of category) {
      const chain = makeCategoryChain(item.name, item.parent)
      words.push(chain.split('/'))
      categoryID.push(await categoryChain2code(chain, cate2indx, indx2cate))
    }
    img.category = categoryID
    put(imageID, img)
    // 更新检索关键字
    let rewordIndx = await getOptional(KeyRewordIndex, {})
    for (let word of words) {
      console.info(word)
      const kwIndx = await getKeywordIndx(word)
      rewordIndx[kwIndx] = pushArray(rewordIndx[kwIndx], imageID)
    }
    put(KeyRewordIndex, rewordIndx)
    // 更新分类表
    let categoryTable = await getOptional(KeyCategory, {})
    for (let cID of categoryID) {
      categoryTable[cID].push(imageID)
    }
    put(KeyCategory, categoryTable)
    let uncategory = await getOptional(KeyUnCategory, [])
    if (categoryID.length !== 0) {
      for (let idx in uncategory) {
        if (uncategory[idx] === imageID) {
          uncategory = uncategory.splice(idx, 1)
          put(KeyUnCategory, uncategory)
          break
        }
      }
    }
  },
  getImageInfo: (imageID) => {
    return getImageInfoImpl(imageID)
  },
  getImagesInfo: async (imagesID) => {
    let images = []
    for (let ids of imagesID) {
      let image = await getImageInfoImpl(ids)
      images.push(image)
    }
    console.info('logger.info', images)
    return images
  },
  getImagesSnap: async () => {
    let imagesSnap = await getOptional(KeyImageIndexes, {})
    console.info('getImagesSnap', imagesSnap)
    return imagesSnap
  },
  updateImage: async (image) => {},
  removeImage: async (imageID) => {
    let snaps = await getOptional(KeyImageIndexes, {})
    delete snaps[imageID]
    await put(KeyImageIndexes, snaps)
    let image = await getOptional(imageID, {})
    console.info('removeImage', image)
    let allTags = await getOptional(KeyTag, {})
    const keywords = image.keyword
    if (keywords != null && keywords.length !== 0) {
      // 移除keyword索引
      let rewordIndx = await getOptional(KeyRewordIndex, {})
      for (let word of keywords) {
        console.info('keyword', word, rewordIndx)
        rewordIndx[word].remove(imageID)
        if (rewordIndx[word].length === 0) delete rewordIndx[word]
        console.info('keyword 2', word)
        allTags[word].remove(imageID)
        if (allTags[word].length === 0) delete allTags[word]
      }
      await put(KeyRewordIndex, rewordIndx)
    }
    // 移除分类记录
    const category = image.category
    if (category != null) {
      let categoryTable = await getOptional(KeyCategory, {})
      for (let c of category) {
        categoryTable[c].remove(imageID)
        if (categoryTable[c].length === 0) delete categoryTable[c]
      }
      await put(KeyCategory, categoryTable)
    }
    // 移除图像记录
    await del(imageID)
  },
  changeImageName: (imageID, label) => {},
  hasDirectory: async (path) => {
    const paths = await getOptional(KeyPath, undefined)
    if (paths === undefined) return false
    // console.info(paths)
    for (let p in paths) {
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
    // console.info(directories)
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
  getTagsWithImages: async () => {
    let tagIDs = await getOptional(KeyTag, {})
    let tags = []
    const words = await getKeyword(Object.keys(tagIDs))
    for (let idx = 0; idx < words.length; ++idx) {
      const item = {label: words[idx], id: tagIDs[idx], type: 'tag'}
      tags.push(item)
    }
    return tags
  },
  addTag: async (imageID, tag) => {
    let tagIDs = await getOptional(KeyTag, {})
    let untags = await getOptional(KeyUnTag, [])
    let indx = await getKeywordIndx([tag])
    const tagID = indx[0]
    // log.info('tag index', tagIDs)
    if (tagIDs[tagID] === undefined) tagIDs[tagID] = []
    tagIDs[tagID].push(imageID)

    let image = await getOptional(imageID, null)
    image.tag.push(tagID)
    image.keyword.push(tagID)
    // console.info('----------', image)

    let rewordIndex = await getOptional(KeyRewordIndex, {})
    if (rewordIndex[tagID] === undefined) rewordIndex[tagID] = []
    rewordIndex[tagID].push(imageID)
    untags.remove(imageID)

    let data = {}
    data[KeyTag] = tagIDs
    data[imageID] = image
    data[KeyRewordIndex] = rewordIndex
    data[KeyUnTag] = untags
    await batchPut(data)
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
  addCategory: async (categoryName, categoryChain, imageID) => {
    let data = {}
    // 1. 生成分类码
    let chain = makeCategoryChain(categoryName, categoryChain)
    const code = await categoryChain2code(chain)
    console.info('code', code)
    let category = await getOptional(KeyCategory, {})
    if (category[code] === undefined) category[code] = []
    // 2. 分类码添加到图片数据中
    if (imageID !== undefined) {
      let image = await getOptional(imageID, null)
      if (image['category'] === undefined) image['category'] = []
      if (image['category'].length === 0) {
        // 从未分类中移除
        let unclazz = await getOptional(KeyUnCategory, [])
        unclazz.remove(imageID)
        await put(KeyUnCategory, unclazz)
      }
      image['category'].push(code)
      // 3. 分类码表添加图片id
      category[code].push(imageID)
      data[imageID] = image
    }
    data[KeyCategory] = category
    await batchPut(data)
  },
  removeCategory: async (categoryName, categoryChain) => {
    let chain = makeCategoryChain(categoryName, categoryChain)
    const code = await categoryChain2code(chain)
    let category = await getOptional(KeyCategory, {})
    if (category[code] === undefined) return
    let uncategory = []
    for (let iid of category[code]) {
      let image = await getOptional(iid, null)
      image['category'].remove(code)
      if (image['category'].length === 0) {
        uncategory.push(iid)
      }
      await put(iid, image)
    }
    if (uncategory.length) {
      let uc = await getOptional(KeyUnCategory, [])
      uc.concat(uncategory)
      await put(KeyUnCategory, uc)
    }
    delete category[code]
    await put(KeyCategory, category)
  },
  changeCategoryName: async (oldName, newName) => {
    console.info('oldName:', oldName, ', newName:', newName)
    let chain = makeCategoryChain(oldName)
    const code = await categoryChain2code(chain)
    let category = await getOptional(KeyCategory, {})
    if (category[code] === undefined) return
    await put(KeyCategory, category)
  },
  getAllCategory: async () => {
    let data = {}
    let category = await getOptional(KeyCategory, {})
    // console.info(category)
    let indx2category = await getOptional(KeyIndex2Category, {})
    // console.info('indx2category', indx2category)
    let imagesSnap = await getOptional(KeyImageIndexes, [])
    // console.info('imagesSnap', imagesSnap)
    for (let cate in category) {
      let chains = await code2categoryChain(cate, indx2category)
      let names = []
      for (let imgID of category[cate]) {
        names.push({label: imagesSnap[imgID].name, id: imgID, type: 'img'})
      }
      data[chains] = names
    }
    console.info('get all category:', data)
    let structCategory = []
    const createChainStruct = (clz, childrenName, items) => {
      const newName = childrenName[0]
      clz['label'] = newName
      childrenName.splice(0, 1)
      // console.info('childrenName', childrenName, childrenName.length)
      if (childrenName.length !== 0) {
        let t = {}
        let child = createChainStruct(t, childrenName, items)
        if (clz['children'] === undefined) clz['children'] = []
        // console.info('child', child)
        clz['children'].push(child)
      } else {
        if (clz['children'] === undefined) clz['children'] = items
        else clz['children'] = clz['children'].concat(items)
      }
      return clz
    }
    for (let chains in data) {
      const chain = chains.split('/')
      let root = {}
      console.info(chain)
      const result = createChainStruct(root, chain, data[chains])
      structCategory.push(result)
    }
    console.info('structCategory', structCategory)
    return structCategory
  },
  getUncategoryImages: async (retrieveLength) => {
    let imgsID = await getOptional(KeyUnCategory, [])
    if (retrieveLength) return imgsID.length
    let images = []
    for (let imgID of imgsID) {
      let img = await getOptional(imgID, null)
      images.push(img)
    }
    return images
  },
  getUntagImages: async (retrieveLength) => {
    let imgsID = await getOptional(KeyUnTag, [])
    if (retrieveLength) return imgsID.length
    let images = []
    for (let imgID of imgsID) {
      let img = await getOptional(imgID, null)
      images.push(img)
    }
    return images
  }
}
