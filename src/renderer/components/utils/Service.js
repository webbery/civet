import util from 'util'
// import Log from '@/../public/Logger'
import { ViewType } from '@/../public/ExtensionHostType'

const { ipcRenderer } = require('electron')

// [发送的消息: 回应的消息]
const replyMessageMap = {
  hasDirectory: 'isDirectoryExist',
  getImagesWithDirectoryFormat: 'replyImagesWithDirectory',
  getImagesInfo: 'replyImagesInfo',
  getImageInfo: 'replyImageInfo',
  getAllTags: 'replyAllTags',
  getAllTagsWithImages: 'replyAllTagsWithImages',
  queryFiles: 'replyQueryFilesResult',
  getAllCategory: 'replyAllCategory',
  getCategoryDetail: 'replyClassesInfo',
  getUncategoryImages: 'replyUncategoryImages',
  getUntagImages: 'replyUntagImages',
  reInitDB: 'replyReloadDBStatus',
  getFilesSnap: 'replyFilesSnap',
  install: 'replyInstallResult',
  uninstall: 'replyUninstallResult',
  getExtensions: 'replyAllExtensions'
}

const getServiceInstance = (function() {
  let hasInited
  const callbackCache = {}
  const EventMap = {
    Search: ViewType.Search,
    DetailView: ViewType.DetailView,
    Overview: ViewType.Overview,
    Navigation: ViewType.Navigation,
    Property: ViewType.Property
  }
  let viewCallback = {}
  let service
  let promiseOn
  let requestID = 0
  return function () {
    if (hasInited === undefined) {
      hasInited = true
      service = {
        send: (msgType, msgData) => {
          requestID += 1
          console.info('message-from-renderer: type=' + msgType + ', data', msgData)
          ipcRenderer.send('message-from-renderer', {
            id: requestID,
            type: msgType,
            data: msgData
          })
          return requestID
        },
        on: (type, callback) => {
          console.info('regist message-from-main: type=' + type)
          if (callbackCache[type] === undefined) {
            // callbackCache[type] = [{request, callback}]
            callbackCache[type] = [callback]
          } else {
            callbackCache[type].push(callback)
          }
        },
        onViewUpdate: (type, callback) => {
          if (viewCallback[type] === undefined) {
            viewCallback[type] = [callback]
          } else {
            viewCallback[type].push(callback)
          }
        }
      }
      promiseOn = util.promisify(service.on)
      service.get = async (msgType, params) => {
        service.send(msgType, params)
        if (replyMessageMap[msgType] === undefined) {
          console.error(`reply[${msgType}] is not defined, params: ${params}`)
        }
        const result = await promiseOn(replyMessageMap[msgType])
        return result
      }
      ipcRenderer.on('message-to-renderer', (sender, msg) => {
        const callbacks = callbackCache[msg.type]
        if (callbacks === undefined) {
          const msgType = msg.type.split('.')
          if (msgType.length === 4) {
            const viewFunc = viewCallback[msgType[0]]
            if (viewFunc !== undefined) {
              for (const f of viewFunc) {
                f(msgType[2], msgType[1], msgType[3], msg.data.msg[0])
              }
            }
          } else if (msgType.length === 3) {
            //
            const viewFunc = viewCallback[msgType[0]]
            if (viewFunc !== undefined) {
              for (const f of viewFunc) {
                f(msgType[2], msgType[1], msg.data.msg[0])
              }
            }
          } else {
            console.error(`reply[${msg.type}] is not defined, params: ${msg.data}`)
          }
          return
        }
        // console.info('message-to-renderer', msg.type)
        callbacks.forEach(callback => {
          callback(null, msg.data.msg)
        })
      }) // 监听主进程的消息
    }
    return service
  }
})()

export default {
  getServiceInstance: getServiceInstance,
  IS_DIRECTORY_EXIST: 'hasDirectory',
  GET_IMAGE_INFO: 'getImageInfo',
  GET_SELECT_CONTENT_ITEM_INFO: 'getSelectContentItemInfo',
  GET_IMAGES_INFO: 'getImagesInfo',
  GET_IMAGES_INDEXES: 'getImagesIndex',
  GET_IMAGES_DIRECTORY: 'getImagesWithDirectoryFormat',
  GET_FILES_SNAP: 'getFilesSnap',
  GET_ALL_TAGS: 'getAllTags',
  GET_ALL_TAGS_WITH_IMAGES: 'getAllTagsWithImages',
  GET_ALL_CATEGORY: 'getAllCategory',
  GET_CATEGORY_DETAIL: 'getCategoryDetail',
  GET_UNCATEGORY_IMAGES: 'getUncategoryImages',
  GET_UNTAG_IMAGES: 'getUntagImages',
  ADD_IMAGES_BY_DIRECORY: 'addImagesByDirectory',
  ADD_IMAGES_BY_PATHS: 'addImagesByPaths',
  SET_TAG: 'setTag',
  ADD_CATEGORY: 'addCategory',
  REMOVE_TAG: 'removeTag',
  REMOVE_FILES: 'removeFiles',
  REMOVE_CLASSES: 'removeClasses',
  QUERY_FILES: 'queryFiles',
  ON_FILE_UPDATE: 'updateImageList',
  ON_ERROR_MESSAGE: 'onErrorMessage',
  UPDATE_IMAGE_CATEGORY: 'updateImageCategory',
  UPDATE_CATEGORY_NAME: 'updateCategoryName',
  UPDATE_FILE_NAME: 'updateFileName',
  REINIT_DB: 'reInitDB',
  REMOVE_DB: 'removeDB',
  MOUNTED: 'mounted',
  INSTALL_EXTENSION: 'install',
  UNINSTALL_EXTENSION: 'uninstall',
  UPDATE_EXTENSION: 'update',
  LIST_EXTENSION: 'getExtensions'
}
