
export const ReplyType = {
  WORKER_UPDATE_IMAGE_DIRECTORY: 'updateImageList',
  INFOM_ERROR_MESSAGE: 'onErrorMessage',
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
  REPLY_RELOAD_DB_STATUS: 'replyReloadDBStatus'
}

export enum MessageState{
  UNINIT = 0,
  PENDING = 1,
  FINISH = 2
}

export class Message {
  id: number = 0;
  type: string = '';
  state: number = MessageState.UNINIT;
  tick: number = 0;   // waitting time, unit second
  msg: any;
}

export interface IMessagePipeline {
  post: any;
}

export class ErrorMessage {
  constructor(command: string, args: any) {}
}