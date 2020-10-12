import JString from '../public/String'
// import CV from '../public/CV'
import { ImageParser, JImage } from './Image'
// import { CategoryArray } from './Category'
import { CivetConfig } from '../public/CivetConfig'
import Kernel from '../public/Kernel'
console.info('finish init kernel')
const cvtConfig = new CivetConfig()
// 尽早打开主窗口
const { ipcRenderer } = require('electron')
ready()

/* ************************ ↓↓↓↓↓↓发布时注释掉该部分↓↓↓↓↓↓ ********************** */
// import Vue from 'vue'
// import App from './App'
// import ElementUI from 'element-ui'
// import 'element-theme-dark'
// if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
// Vue.config.productionTip = false
// Vue.use(ElementUI)

// /* eslint-disable no-new */
// new Vue({
//   components: { App },
//   template: '<App/>'
// }).$mount('#app')
/* ************************ ↑↑↑↑↑发布时注释掉该部分↑↑↑↑↑ ********************** */

Array.prototype.remove = function (val) {
  let index = this.indexOf(val)
  if (index > -1) {
    this.splice(index, 1)
  }
}

const threshodMode = false
// your background code here
const fs = require('fs')
const timer = (function () {
  let t = null
  return {
    start: (func, tick) => {
      const task = () => {
        // 执行一次func, 然后定时执行func
        func()
        if (t === null) {
          t = setInterval(func, tick)
          console.info('start timer')
        }
      }
      if (t === null) setImmediate(task)
    },
    stop: () => {
      if (t !== null) {
        clearTimeout(t)
        t = null
        console.info('stop timer')
      }
    }
  }
})()
let queue = []

const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  IS_DIRECTORY_EXIST: 'isDirectoryExist',
  REPLY_IMAGES_DIRECTORY: 'replyImagesWithDirectory',
  REPLY_IMAGES_INFO: 'replyImagesInfo',
  REPLY_IMAGE_INFO: 'replyImageInfo',
  REPLY_ALL_TAGS: 'replyAllTags',
  REPLY_ALL_TAGS_WITH_IMAGES: 'replyAllTagsWithImages',
  REPLY_FIND_IMAGE_WITH_KEYWORD: 'replyFindImageResult',
  REPLAY_ALL_CATEGORY: 'replyAllCategory',
  REPLY_UNCATEGORY_IMAGES: 'replyUncategoryImages',
  REPLY_UNTAG_IMAGES: 'replyUntagImages',
  REPLY_RELOAD_DB_STATUS: 'replyReloadDBStatus'
}

let bakDir
// console.info(configPath, '............', userDir)
// 递归创建目录 同步方法
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    const path = require('path')
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

function initHardLinkDir(resourcName) {
  const config = cvtConfig.getConfig()
  for (let resource of config.resources) {
    if (resourcName === resource.name) {
      bakDir = resource.linkdir
      if (!fs.existsSync(bakDir)) {
        console.info('mkdir: ', bakDir)
        mkdirsSync(bakDir)
      }
      break
    }
  }
}
function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    if (bakDir === undefined) {
      const config = cvtConfig.getConfig()
      console.info('--------2----------', config)
      initHardLinkDir(config.app.default)
    }
    console.info('--------3----------', bakDir)
    const parser = new ImageParser(bakDir)
    let img = parser.parse(fullpath, info)
    reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [img.toJson()])
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

function ready() {
  ipcRenderer.send('ready')
  // GPUTest()
}

function reply2Renderer(type, value) {
  if (threshodMode === true) {
    // 首先存到队列中，如果定时器关闭，启动定时器
    queue.push({type: type, data: value})
    // console.info('queue input ', queue.length)
    timer.start(() => {
      // console.info('queue task', queue.length)
      if (queue.length === 0) {
        timer.stop()
        return
      }
      const range = queue.splice(0, queue.length)
      // console.info(range.length)
      for (let msg of range) {
        // console.info('send', msg)
        ipcRenderer.send('message-from-worker', msg)
      }
    }, 1000)
  } else {
    ipcRenderer.send('message-from-worker', {type: type, data: value})
  }
}

const messageProcessor = {
  'addImagesByDirectory': readDir,
  'addImagesByPaths': (data) => {
    for (let fullpath of data) {
      readImages(fullpath)
    }
  },
  'getImagesInfo': async (data) => {
    // let imagesIndex = []
    // if (data === undefined) {
    //   // 全部图片信息
    //   let imagesSnap = await localStorage.getImagesSnap()
    //   for (let imgID in imagesSnap) {
    //     imagesIndex.push(imgID)
    //   }
    // } else {
    //   imagesIndex = data
    // }
    // let imgs = await localStorage.getImagesInfo(imagesIndex)
    // // console.info('getImagesInfo', imgs)
    // let images = []
    // for (let img of imgs) {
    //   images.push(new JImage(img))
    // }
    // reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  'getImageInfo': async (imageID) => {
    let img = await localStorage.getFilesInfo(imageID)
    let image = new JImage(img)
    reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
  },
  'addTag': async (data) => {
    // console.info(data.tagName)
    await Kernel.addTags(data.imageID, data.tagName)
  },
  'removeTag': async (data) => {
    await Kernel.removeTags(data.tagName, data.imageID)
  },
  'getAllTags': async (data) => {
    let allTags = await Kernel.getTags()
    reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
  },
  'getAllTagsWithImages': async (data) => {
    let allTags = await Kernel.getTagsOfFiles()
    console.info('allTags', allTags)
    reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  },
  'findImageWithKeyword': async (keywords) => {
    let allID = await Kernel.searchFiles(keywords)
    // console.info('reply: ', ReplyType.REPLY_FIND_IMAGE_WITH_KEYWORD)
    reply2Renderer(ReplyType.REPLY_FIND_IMAGE_WITH_KEYWORD, allID)
  },
  'addCategory': async (categoryName, chain, imageID) => {
    return Kernel.addClasses(categoryName, chain, imageID)
  },
  'getAllCategory': async () => {
    // let category = await CategoryArray.loadFromDB()
    // reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
  },
  'getUncategoryImages': async () => {
    let uncateimgs = await Kernel.getUnClassifyFiles()
    reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
  },
  'getUntagImages': async () => {
    let untagimgs = await Kernel.getUnTagFiles()
    reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
  },
  'updateImageCategory': async (data) => {
    await localStorage.updateFileClass(data.imageID, data.category)
  },
  'updateCategoryName': async (oldName, newName) => {
    await localStorage.updateClassName(oldName, newName)
  },
  'reInitDB': (data) => {
    // localStorage.reloadDB(data)
    // reply2Renderer(ReplyType.REPLY_RELOAD_DB_STATUS, true)
  }
}

// if message is received, pass it back to the renderer via the main thread
ipcRenderer.on('message-from-main', (event, arg) => {
  console.info('==================')
  console.info('arg', arg)
  console.info('==================')
  messageProcessor[arg.type](arg.data)
})
