import util from 'util'

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
  'findImageWithKeyword': 'replyFindImageResult'
}

let getServiceInstance = (function() {
  let hasInited
  let callbackCache = []
  let service
  let promiseOn
  return function () {
    if (hasInited === undefined) {
      hasInited = true
      service = {
        send: (msgType, msgData) => {
          console.info('message-from-renderer: type=' + msgType + ', data=' + msgData)
          ipcRenderer.send('message-from-renderer', {
            type: msgType,
            data: msgData
          })
        },
        on: (type, callback) => {
          console.info('message-from-main: type=' + type)
          callbackCache.push({
            type,
            callback
          })
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
        callbackCache.forEach(cache => {
          if (cache.type === msg.type) {
            cache.callback && cache.callback(null, msg.data)
          }
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
  ADD_IMAGES_BY_DIRECORY: 'addImagesByDirectory',
  ADD_IMAGES_BY_PATHS: 'addImagesByPaths',
  ADD_TAG: 'addTag',
  FIND_IMAGES_BY_KEYWORD: 'findImageWithKeyword',
  ON_IMAGE_UPDATE: 'updateImageList'
}
