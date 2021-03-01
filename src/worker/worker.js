import JString from '../public/String'
// import CV from '../public/CV'
// import { JImage } from './Image'
// import { CategoryArray } from './Category'
import ElementUI from 'element-ui'
import 'element-theme-dark'
import Vue from 'vue'
import App from './App'
import storage from '../public/Kernel'
import { ImageService } from './service/ImageService'
import { reply2Renderer, ReplyType } from './transfer'
import { IFileImpl } from '../public/civet'

// 尽早打开主窗口
const { ipcRenderer } = require('electron')

// ready()
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.$ipcRenderer = ipcRenderer
window.eventBus = new Vue()

/* splash */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')

Array.prototype.remove = function (val) {
  const index = this.indexOf(val)
  if (index > -1) {
    this.splice(index, 1)
  }
}

const isStart = false
function updateStatus(status) {
  if (isStart === false) {
    window.eventBus.$emit('status', status)
  }
}
// your background code here
const fs = require('fs')

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

async function readImages(fullpath) {
  const info = fs.statSync(fullpath)
  if (info.isDirectory()) {
    readDir(fullpath)
  } else {
    // if (bakDir === undefined) {
    //   const config = cvtConfig.getConfig()
    //   console.info('--------2----------', config)
    //   initHardLinkDir(config.app.default)
    // }
    const service = new ImageService()
    const file = await service.read(fullpath)
    console.info('readImages', file)
    reply2Renderer(ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY, [file.toJson()])
  }
}

let totalFiles = 0
let progressLoad = 0
function readDir(path) {
  fs.readdir(path, async function(err, menu) {
    if (err) return
    // console.info(menu)
    totalFiles += menu.length
    for (const item of menu) {
      await readImages(JString.joinPath(path, item))
    }
    reply2Renderer(ReplyType.REPLY_FILES_LOAD_COUNT, { count: menu.length, total: totalFiles })
    progressLoad += menu.length
    if (progressLoad === totalFiles) {
      totalFiles = 0
      progressLoad = 0
    }
  })
}

const messageProcessor = {
  addImagesByDirectory: readDir,
  addImagesByPaths: (data) => {
    for (const fullpath of data) {
      readImages(fullpath)
    }
  },
  getImagesInfo: (data) => {
    updateStatus('reading files')
    let imagesIndex = []
    if (data === undefined) {
      // 全部图片信息
      const imagesSnap = storage.getFilesSnap()
      for (const imgID in imagesSnap) {
        imagesIndex.push(imgID)
      }
    } else {
      imagesIndex = data
    }
    const imgs = storage.getFilesInfo(imagesIndex)
    console.info('getImagesInfo', imgs)
    const images = []
    for (const img of imgs) {
      images.push(new IFileImpl(img))
    }
    reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  },
  getFilesSnap: (data) => {
    // 全部图片信息
    const imagesSnap = storage.getFilesSnap()
    reply2Renderer(ReplyType.REPLY_FILES_SNAP, imagesSnap)
  },
  getImageInfo: (imageID) => {
    const img = storage.getFilesInfo([imageID])
    // console.info('getImagesInfo', img)
    const image = new IFileImpl(img[0])
    reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
  },
  setTag: (data) => {
    console.info(data)
    storage.setTags(data.id, data.tag)
  },
  removeFiles: (filesID) => {
    console.info('removeFiles:', filesID)
    storage.removeFiles(filesID)
  },
  removeTag: (data) => {
    console.info(data)
    storage.removeTags(data.filesID, data.tag)
  },
  removeClasses: (mutation) => {
    console.info('removeClasses', mutation)
    storage.removeClasses(mutation)
  },
  getAllTags: (data) => {
    const allTags = storage.getAllTags()
    reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
  },
  getAllTagsWithImages: (data) => {
    const allTags = storage.getTagsOfFiles()
    console.info('allTags', allTags)
    reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  },
  queryFiles: (nsql) => {
    const allFiles = storage.query(nsql)
    console.info(nsql, 'reply: ', allFiles)
    reply2Renderer(ReplyType.REPLY_QUERY_FILES, allFiles)
  },
  addCategory: (mutation) => {
    console.info('add class', mutation)
    return storage.addClasses(mutation)
  },
  getAllCategory: (parent) => {
    const category = storage.getClasses()
    // let category = await CategoryArray.loadFromDB()
    console.info('getAllCategory', category)
    reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
  },
  getCategoryDetail: (parent) => {
    const category = storage.getClassDetail(parent)
    // let category = await CategoryArray.loadFromDB()
    console.info('getCategoryDetail', category)
    reply2Renderer(ReplyType.REPLY_CLASSES_INFO, category)
  },
  getUncategoryImages: async () => {
    updateStatus('reading unclassify info')
    const uncateimgs = storage.getUnClassifyFiles()
    reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
    console.info('unclasses', uncateimgs)
  },
  getUntagImages: () => {
    updateStatus('reading untag info')
    const untagimgs = storage.getUnTagFiles()
    reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
    console.info('untag', untagimgs)
  },
  updateImageCategory: (data) => {
    storage.updateFileClass(data.imageID, data.category)
  },
  updateCategoryName: (data) => {
    console.info('old:', data.oldName, 'new:', data.newName)
    storage.updateClassName(data.oldName, data.newName)
  },
  updateFileName: (data) => {
    console.info('updateFileName id:', data.id, 'new:', data.filename)
    // {id: [fileids[0]], filename: '测试'}
    storage.updateFile({ id: [data.id], filename: data.filename })
  },
  reInitDB: async (data) => {
    console.info('init db')
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
  console.info('checking-for-update, event:', event, arg)
})

ipcRenderer.on('update-available', (event, arg) => {
  console.info('update-available, event:', event, arg)
})

ipcRenderer.on('update-not-available', (event, arg) => {
  console.info('update-not-available, event:', event, arg)
})

ipcRenderer.on('error', (event, arg) => {
  console.info('error, event:', event, arg)
})

ipcRenderer.on('download-progress', (event, arg) => {
  console.info('download-progress, event:', event, arg)
})

ipcRenderer.on('update-downloaded', (event, arg) => {
  console.info('update-downloaded, event:', event, arg)
})
