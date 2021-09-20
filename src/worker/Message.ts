
export const ReplyType = {
  WORKER_UPDATE_RESOURCES: 'updateImageList',
  INFOM_ERROR_MESSAGE: 'onErrorMessage',
  REPLY_WORKBENCH_VIEW: 'replyWorkbenchView',
  REPLY_FILES_LOAD_COUNT: 'replyFilesLoadCount',
  IS_DIRECTORY_EXIST: 'isDirectoryExist',
  REPLY_IMAGES_DIRECTORY: 'replyImagesWithDirectory',
  REPLY_IMAGES_INFO: 'replyImagesInfo',
  REPLY_IMAGE_INFO: 'replyImageInfo',
  REPLY_FILES_SNAP: 'replyFilesSnap',
  REPLY_ALL_TAGS: 'replyAllTags',
  REPLY_ALL_TAGS_WITH_IMAGES: 'replyAllTagsWithImages',
  REPLY_QUERY_FILES: 'replyQueryFilesResult',
  REPLAY_ALL_CATEGORY: 'replyAllCategory',
  REPLY_CLASSES_INFO: 'replyClassesInfo',
  REPLY_UNCATEGORY_IMAGES: 'replyUncategoryImages',
  REPLY_UNTAG_IMAGES: 'replyUntagImages',
  REPLY_RELOAD_DB_STATUS: 'replyReloadDBStatus',
  REPLY_INSTALL_RESULT: 'replyInstallResult',
  REPLY_UNINSTALL_RESULT: 'replyUninstallResult',
  REPLY_EXTENSION_LIST_INFO: 'replyAllExtensions'
}

// export interface IMessagePipeline {
//   reply: any;
//   post: any;
// }

export class ErrorMessage {
  constructor(command: string, args: any) {}
}