import JString from '../public/String'
import NLP from '../public/NLP'
import ExifReader from 'exifreader'
import localStorage from './LocalStorage'

console.info('1111111111111111')
// your background code here
const { ipcRenderer } = require('electron')
const fs = require('fs')
const crypto = require('crypto')
const sharp = require('sharp')
const path = require('path')
// const util = require('util')
// const bhash = util.promisify(blockhash)
// console.info(bhash)
// Send logs as messages to the main thread to show on the console
// function log(value) {
//   ipcRenderer.send('message-from-worker', process.pid + ': ' + value)
// }

const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  IS_DIRECTORY_EXIST: 'isDirectoryExist',
  REPLY_IMAGES_DIRECTORY: 'replyImagesWithDirectory',
  REPLY_IMAGES_INFO: 'replyImagesInfo',
  REPLY_IMAGE_INFO: 'replyImageInfo',
  REPLY_ALL_TAGS: 'replyAllTags',
  REPLY_FIND_IMAGE_WITH_KEYWORD: 'replyFindImageResult'
}

async function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    const item = path.basename(fullpath)
    if (JString.isImage(item)) {
      let keywords = NLP.getNouns(fullpath)
      console.info('keyword:', keywords)
      // console.info(dhash)
      const image = fs.readFileSync(fullpath)
      const tags = ExifReader.load(image)
      delete tags['MakerNote']
      console.info(fullpath, tags, info)
      let size = info.size
      let thumbnail = null
      if (size > 5 * 1024 * 1024) {
        thumbnail = tags['Thumbnail'].base64
      }
      let scaleWidth = Math.ceil(tags['Image Width'].value / 5)
      if (scaleWidth < 8) scaleWidth = tags['Image Width'].value
      const scaleHeight = scaleWidth + 1
      const pixels = await sharp(fullpath)
        .resize(scaleWidth, scaleHeight)
        .grayscale()
        .toBuffer()
      const MD5 = crypto.createHash('md5')
      // console.info(pixels.toString())
      const hash = MD5.update(pixels.toString()).digest('hex')
      // const hash = JString.dhash(image, tags['Image Width'].value, tags['Image Height'].value)
      // const hash = await imghash.hash(fullpath)
      // const hash = '1'
      let type = tags['format']
      if (type === undefined) {
        type = JString.getFormatType(item)
      } else {
        type = JString.getFormatType(tags['format'].description)
      }
      let datetime = tags['DateTime']
      if (datetime === undefined) {
        datetime = info.atime.toString()
      } else {
        datetime = datetime.value[0]
      }
      const dir = path.dirname(fullpath)
      let fileInfo = {
        hash: hash.toString(),
        path: dir,
        filename: item,
        keyword: keywords,
        size: info.size,
        datetime: datetime,
        width: tags['Image Width'].value,
        height: tags['Image Height'].value,
        thumbnail: thumbnail,
        type: type
      }
      // 更新目录窗口
      localStorage.addImages([fileInfo])
      reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [fileInfo])
    }
  }
}

function readDir(path) {
  fs.readdir(path, function(err, menu) {
    if (err) return
    // let files = []
    for (let item of menu) {
      readImages(JString.joinPath(path, item))
    }
  })
}

// let the main thread know this thread is ready to process something
function ready() {
  ipcRenderer.send('ready')
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
      imagesIndex = await localStorage.getImagesIndex()
    }
    let images = await localStorage.getImagesInfo(imagesIndex)
    reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  'getImageInfo': async (imageID) => {
    let image = await localStorage.getImageInfo(imageID)
    reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
  },
  'addTag': async (data) => {
    await localStorage.addTag(data.imageID, data.imageID.tagName)
  },
  'getAllTags': async (data) => {
    let allTags = await localStorage.getTags()
    reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
  },
  'findImageWithKeyword': async (keywords) => {
    let allID = await localStorage.findImageWithKeyword(keywords)
    reply2Renderer(ReplyType.REPLY_FIND_IMAGE_WITH_KEYWORD, allID)
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
