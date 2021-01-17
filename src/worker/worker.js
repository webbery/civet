import JString from '../public/String'
// import CV from '../public/CV'
import { ImageParser, JImage } from './Image'
// import { CategoryArray } from './Category'
import 'element-theme-dark'
import Vue from 'vue'
import App from './App'
import storage from '../public/Kernel'

// 尽早打开主窗口
const { ipcRenderer } = require('electron')

// ready()
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
// Vue.use(ElementUI)
Vue.prototype.$ipcRenderer = ipcRenderer

/* splash */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')

Array.prototype.remove = function (val) {
  let index = this.indexOf(val)
  if (index > -1) {
    this.splice(index, 1)
  }
}

const threshodMode = true
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
let queue = {}

const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  IS_DIRECTORY_EXIST: 'isDirectoryExist',
  REPLY_IMAGES_DIRECTORY: 'replyImagesWithDirectory',
  REPLY_IMAGES_INFO: 'replyImagesInfo',
  REPLY_IMAGE_INFO: 'replyImageInfo',
  REPLY_ALL_TAGS: 'replyAllTags',
  REPLY_ALL_TAGS_WITH_IMAGES: 'replyAllTagsWithImages',
  REPLY_QUERY_FILES: 'replyQueryFilesResult',
  REPLAY_ALL_CATEGORY: 'replyAllCategory',
  REPLY_UNCATEGORY_IMAGES: 'replyUncategoryImages',
  REPLY_UNTAG_IMAGES: 'replyUntagImages',
  REPLY_RELOAD_DB_STATUS: 'replyReloadDBStatus'
}

// let bakDir
// // console.info(configPath, '............', userDir)
// // 递归创建目录 同步方法
// function mkdirsSync(dirname) {
//   if (fs.existsSync(dirname)) {
//     return true
//   } else {
//     const path = require('path')
//     if (mkdirsSync(path.dirname(dirname))) {
//       fs.mkdirSync(dirname)
//       return true
//     }
//   }
// }

// function initHardLinkDir(resourcName) {
//   const config = cvtConfig.getConfig()
//   for (let resource of config.resources) {
//     if (resourcName === resource.name) {
//       bakDir = resource.linkdir
//       if (!fs.existsSync(bakDir)) {
//         console.info('mkdir: ', bakDir)
//         mkdirsSync(bakDir)
//       }
//       break
//     }
//   }
// }
function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    // if (bakDir === undefined) {
    //   const config = cvtConfig.getConfig()
    //   console.info('--------2----------', config)
    //   initHardLinkDir(config.app.default)
    // }
    const parser = new ImageParser(fullpath)
    let img = parser.parse(info)
    console.info('readImages', img)
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

function reply2Renderer(type, value) {
  if (threshodMode === true) {
    // 首先存到队列中，如果定时器关闭，启动定时器
    if (!queue[type]) {
      queue[type] = []
    }
    if (Array.isArray(value)) {
      queue[type].push.apply(queue[type], value)
    } else {
      queue[type].push(value)
    }
    console.info('queue value:', queue)
    timer.start(() => {
      console.info('queue task', queue.length, Object.keys(queue))
      if (Object.keys(queue).length === 0) {
        timer.stop()
        return
      }
      console.info(queue.length)
      for (let tp in queue) {
        if (queue[tp].length === 1) {
          ipcRenderer.send('message-from-worker', {type: tp, data: queue[tp]})
        } else {
          console.info('send ', queue[tp].length, 'to renderer')
          ipcRenderer.send('message-from-worker', {type: tp, data: queue[tp]})
        }
      }
      console.info('clear queue')
      queue = {}
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
  'getImagesInfo': (data) => {
    let imagesIndex = []
    if (data === undefined) {
      // 全部图片信息
      let imagesSnap = storage.getFilesSnap()
      for (let imgID in imagesSnap) {
        imagesIndex.push(imgID)
      }
    } else {
      imagesIndex = data
    }
    let imgs = storage.getFilesInfo(imagesIndex)
    console.info('getImagesInfo', imgs)
    let images = []
    for (let img of imgs) {
      images.push(new JImage(img))
    }
    reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  'getImageInfo': (imageID) => {
    const img = storage.getFilesInfo([imageID])
    // console.info('getImagesInfo', img)
    let image = new JImage(img[0])
    reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
  },
  'setTag': (data) => {
    console.info(data)
    storage.setTags(data.id, data.tag)
  },
  'removeFiles': (filesID) => {
    console.info('removeFiles:', filesID)
    storage.removeFiles(filesID)
  },
  'removeTag': (data) => {
    console.info(data)
    storage.removeTags(data.filesID, data.tag)
  },
  'removeClasses': (mutation) => {
    console.info('removeClasses', mutation)
    storage.removeClasses(mutation)
  },
  'getAllTags': (data) => {
    let allTags = storage.getAllTags()
    reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
  },
  'getAllTagsWithImages': (data) => {
    let allTags = storage.getTagsOfFiles()
    console.info('allTags', allTags)
    reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  },
  'getCategoryDetail': (category) => {},
  'queryFiles': (nsql) => {
    let allFiles = storage.query(nsql)
    console.info(nsql, 'reply: ', allFiles)
    reply2Renderer(ReplyType.REPLY_QUERY_FILES, allFiles)
  },
  'addCategory': (mutation) => {
    console.info('add class', mutation)
    return storage.addClasses(mutation)
  },
  'getAllCategory': (parent) => {
    const category = storage.getClasses(parent)
    // let category = await CategoryArray.loadFromDB()
    console.info('getAllCategory', category)
    reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
  },
  'getUncategoryImages': async () => {
    let uncateimgs = storage.getUnClassifyFiles()
    reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
    console.info('unclasses', uncateimgs)
  },
  'getUntagImages': () => {
    let untagimgs = storage.getUnTagFiles()
    reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
    console.info('untag', untagimgs)
  },
  'updateImageCategory': (data) => {
    storage.updateFileClass(data.imageID, data.category)
  },
  'updateCategoryName': (oldName, newName) => {
    console.info('old:', oldName, 'new:', newName)
    storage.updateClassName(oldName, newName)
  },
  'updateFileName': (data) => {
    // storage.
  },
  'reInitDB': async (data) => {
    storage.init()
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

ipcRenderer.on('checking-for-update', (event, arg) => {
})

ipcRenderer.on('update-available', (event, arg) => {
})

ipcRenderer.on('update-not-available', (event, arg) => {
})

ipcRenderer.on('error', (event, arg) => {
})

ipcRenderer.on('download-progress', (event, arg) => {
})

ipcRenderer.on('update-downloaded', (event, arg) => {
})
