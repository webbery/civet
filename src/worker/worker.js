import JString from '../public/String'
import ExifReader from 'exifreader'
// import fnv from 'fnv-plus'

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

async function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    const item = path.basename(fullpath)
    if (JString.isImage(item)) {
      let keywords = JString.getNouns(fullpath)
      console.info('keyword:', keywords)
      // console.info(dhash)
      const image = fs.readFileSync(fullpath)
      const tags = ExifReader.load(image)
      delete tags['MakerNote']
      // console.info(fullpath, tags)
      let size = info.size
      let thumbnail = null
      if (size > 5 * 1024 * 1024) {
        thumbnail = tags['Thumbnail'].base64
      }
      let scaleWidth = Math.ceil(tags['Image Width'].value / 5)
      if (scaleWidth < 8) scaleWidth = tags['Image Width'].value
      const scaleHeight = scaleWidth + 1
      const pixels = await sharp(fullpath)
        .grayscale()
        .resize(scaleWidth, scaleHeight)
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
      console.info(tags)
      const dir = path.dirname(fullpath)
      let fileInfo = {
        id: hash.toString(),
        path: dir,
        filename: item,
        keyword: keywords,
        size: info.size,
        datetime: tags['DateTime'].value[0],
        width: tags['Image Width'].value,
        height: tags['Image Height'].value,
        thumbnail: thumbnail,
        type: type
      }
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

const MessageType = {
  EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY: 'updateImportDirectory',
  EVENT_LOAD_IMAGES: 'dropImages'
}
const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList'
}
// if message is received, pass it back to the renderer via the main thread
ipcRenderer.on('message-from-main', (event, arg) => {
  console.info('==================')
  console.info('arg', arg)
  console.info('==================')
  let data = arg.data
  switch (arg.type) {
    case MessageType.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY:
      // 后台读取目录中的数据信息
      readDir(data)
      break
    case MessageType.EVENT_LOAD_IMAGES:
      readImages(data)
      break
    default:
      break
  }
  // log('task finish')
  // ipcRenderer.send('for-renderer', process.pid + ': reply to ' + arg)
  // ready()
})

ready()
