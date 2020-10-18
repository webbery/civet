import util from 'util'
import Log from '@/../public/Logger'

const { ipcRenderer } = require('electron')

// [发送的消息: 回应的消息]
const replyMessageMap = {
  // 'addImagesByDirectory': 'updateImageList',
  // 'addImagesByPaths': 'updateImageList',
  'hasDirectory': 'isDirectoryExist',
  'getImagesWithDirectoryFormat': 'replyImagesWithDirectory',
  'getImagesInfo': 'replyImagesInfo',
  'getImageInfo': 'replyImageInfo',
  'getAllTags': 'replyAllTags',
  'getAllTagsWithImages': 'replyAllTagsWithImages',
  'findImageWithKeyword': 'replyFindImageResult',
  'getAllCategory': 'replyAllCategory',
  'getUncategoryImages': 'replyUncategoryImages',
  'getUntagImages': 'replyUntagImages',
  'reInitDB': 'replyReloadDBStatus'
}

let getServiceInstance = (function() {
  let hasInited
  let callbackCache = {}
  let service
  let promiseOn
  return function () {
    if (hasInited === undefined) {
      hasInited = true
      service = {
        send: (msgType, msgData) => {
          Log.info('message-from-renderer: type=' + msgType + ', data', msgData)
          ipcRenderer.send('message-from-renderer', {
            type: msgType,
            data: msgData
          })
        },
        on: (type, callback) => {
          console.info('regist message-from-main: type=' + type)
          if (callbackCache[type] === undefined) {
            callbackCache[type] = [callback]
          } else {
            callbackCache[type].push(callback)
          }
        }
      }
      promiseOn = util.promisify(service.on)
      service.get = async (msgType, params) => {
        service.send(msgType, params)
        if (replyMessageMap[msgType] === undefined) {
          console.log(msgType, ' reply is not defined')
        }
        let result = await promiseOn(replyMessageMap[msgType])
        return result
      }
      ipcRenderer.on('message-to-renderer', (sender, msg) => {
        const callbacks = callbackCache[msg.type]
        if (callbacks === undefined) {
          console.info(msg.type, 'no callback')
          return
        }
        callbacks.forEach(callback => {
          callback(null, msg.data)
        })
      }) // 监听主进程的消息
    }
    return service
  }
})()

export default{
  getServiceInstance: getServiceInstance,
  IS_DIRECTORY_EXIST: 'hasDirectory',
  GET_IMAGE_INFO: 'getImageInfo',
  GET_IMAGES_INFO: 'getImagesInfo',
  GET_IMAGES_INDEXES: 'getImagesIndex',
  GET_IMAGES_DIRECTORY: 'getImagesWithDirectoryFormat',
  GET_ALL_TAGS: 'getAllTags',
  GET_ALL_TAGS_WITH_IMAGES: 'getAllTagsWithImages',
  GET_ALL_CATEGORY: 'getAllCategory',
  GET_UNCATEGORY_IMAGES: 'getUncategoryImages',
  GET_UNTAG_IMAGES: 'getUntagImages',
  ADD_IMAGES_BY_DIRECORY: 'addImagesByDirectory',
  ADD_IMAGES_BY_PATHS: 'addImagesByPaths',
  ADD_TAG: 'addTag',
  ADD_CATEGORY: 'addCategory',
  REMOVE_TAG: 'removeTag',
  REMOVE_FILES: 'removeFiles',
  FIND_IMAGES_BY_KEYWORD: 'findImageWithKeyword',
  ON_IMAGE_UPDATE: 'updateImageList',
  UPDATE_IMAGE_CATEGORY: 'updateImageCategory',
  UPDATE_CATEGORY_NAME: 'updateCategoryName',
  REINIT_DB: 'reInitDB'
}
