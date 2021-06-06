import Vue from 'vue'

const bus = new Vue()

export default {
  emit: (msgType, msg) => {
    // console.info(msgType, msg)
    bus.$emit(msgType, msg)
  },
  on: (msgType, callback) => {
    bus.$on(msgType, callback)
  },
  EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY: 'updateImportDirectory',
  EVENT_UPDATE_DISPLAY_IMAGE: 'updateDisplayImage',
  EVENT_SELECT_IMAGE: 'selectImage',
  EVENT_DISPLAY_FILE_NAME: 'displayFileName',
  EVENT_REMOVE_FILES: 'removeFiles',
  EVENT_REMOVE_ITEM: 'removeTreeItem',
  EVENT_UPDATE_NAV_DESCRIBTION: 'updateNavDesc',
  EVENT_DISPLAY_IMAGE: 'displayImage',
  EVENT_DISPLAY_SEARCH_RESULT: 'showSearchResult',
  EVENT_UPDATE_UNCATEGORY_IMAGES: 'updateUncategoryImages',
  EVENT_INIT_RESOURCE_DB: 'initResourceDB',
  EVENT_SCALE_IMAGE: 'scaleImage',
  EVENT_ROTATE_IMAGE: 'rotateImage'
}
