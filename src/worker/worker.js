import JString from '../public/String'
import localStorage from './LocalStorage'
// import CV from '../public/CV'
import JImage from './Image'
import { CategoryArray } from './Category'
import { GPU, input } from 'gpu.js'

// your background code here
const { ipcRenderer } = require('electron')
const fs = require('fs')

const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  IS_DIRECTORY_EXIST: 'isDirectoryExist',
  REPLY_IMAGES_DIRECTORY: 'replyImagesWithDirectory',
  REPLY_IMAGES_INFO: 'replyImagesInfo',
  REPLY_IMAGE_INFO: 'replyImageInfo',
  REPLY_ALL_TAGS: 'replyAllTags',
  REPLY_FIND_IMAGE_WITH_KEYWORD: 'replyFindImageResult',
  REPLAY_ALL_CATEGORY: 'replyAllCategory',
  REPLY_UNCATEGORY_IMAGES: 'replyUncategoryImages'
}

async function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    const img = await JImage.build(fullpath, info)
    if (img) {
      img.saveDB()
      reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [img.toJson()])
    }
  }
}

function readDir(path) {
  fs.readdir(path, function(err, menu) {
    if (err) return
    // console.info(menu)
    for (let item of menu) {
      readImages(JString.joinPath(path, item))
    }
  })
}

function GPUTest() {
  const gpu = new GPU({mode: 'cpu'})
  const value1 = input([1, 2, 3, 4, 5, 6], [2, 1, 3])
  console.info(value1)
  function kernelFunction(x, y) {
    const v = x[this.thread.z][this.thread.y][this.thread.x] + y[this.thread.z][this.thread.y][this.thread.x]
    return v
  }
  const kernel = gpu.createKernel(kernelFunction, {output: [1]})
  console.info('1111111')
  const result = kernel(value1, value1)
  console.info('GPU: ', result)
}
// let the main thread know this thread is ready to process something
function ready() {
  ipcRenderer.send('ready')
  GPUTest()
}

function reply2Renderer(type, value) {
  ipcRenderer.send('message-from-worker', {type: type, data: value})
}

const messageProcessor = {
  'addImagesByDirectory': readDir,
  'addImagesByPaths': (data) => {
    for (let fullpath of data) {
      readImages(fullpath)
    }
  },
  'hasDirectory': async (data) => {
    console.info(data)
    let result = await localStorage.hasDirectory(data)
    reply2Renderer(ReplyType.IS_DIRECTORY_EXIST, result)
  },
  'getImagesWithDirectoryFormat': async (data) => {
    let result = await localStorage.getImagesWithDirectoryFormat()
    reply2Renderer(ReplyType.REPLY_IMAGES_DIRECTORY, result)
  },
  'getImagesInfo': async (data) => {
    let imagesIndex = []
    if (data === undefined) {
      // 全部图片信息
      let imagesSnap = await localStorage.getImagesSnap()
      for (let imgID in imagesSnap) {
        imagesIndex.push(imgID)
      }
    } else {
      imagesIndex = data
    }
    let imgs = await localStorage.getImagesInfo(imagesIndex)
    let images = []
    for (let img of imgs) {
      images.push(new JImage(img))
    }
    reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  'getImageInfo': async (imageID) => {
    let img = await localStorage.getImageInfo(imageID)
    let image = new JImage(img)
    reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
  },
  'addTag': async (data) => {
    // console.info(data.tagName)
    await localStorage.addTag(data.imageID, data.tagName)
  },
  'removeTag': async (data) => {
    await localStorage.removeTag(data.tagName, data.imageID)
  },
  'getAllTags': async (data) => {
    let allTags = await localStorage.getTags()
    reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
  },
  'findImageWithKeyword': async (keywords) => {
    let allID = await localStorage.findImageWithKeyword(keywords)
    // console.info('reply: ', ReplyType.REPLY_FIND_IMAGE_WITH_KEYWORD)
    reply2Renderer(ReplyType.REPLY_FIND_IMAGE_WITH_KEYWORD, allID)
  },
  'addCategory': async (categoryName, chain, imageID) => {
    return localStorage.addCategory(categoryName, chain, imageID)
  },
  'getAllCategory': async () => {
    let category = await CategoryArray.loadFromDB()
    reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
  },
  'getUncategoryImages': async () => {
    let uncateimgs = await localStorage.getUncategoryImages()
    reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
  },
  'updateImageCategory': async (data) => {
    await localStorage.updateImageCatergory(data.imageID, data.category)
  }
}

// if message is received, pass it back to the renderer via the main thread
ipcRenderer.on('message-from-main', (event, arg) => {
  console.info('==================')
  console.info('arg', arg)
  console.info('==================')
  messageProcessor[arg.type](arg.data)
})

ready()
