import { MessagePipeline } from '../MessageTransfer'
import { joinPath } from '../../public/String'
import { ReplyType, Message } from '../Message'
import { Resource, readThumbnail, SerializeAccessor } from '../../public/Resource'
import { CivetDatabase } from '../Kernel'
import { ResourcePath } from '../common/ResourcePath'
import { config } from '../../public/CivetConfig'
import { ResourceObserver } from './ResourceObserver'
import { PropertyType } from '../../public/ExtensionHostType'
import { injectable } from '../Singleton'
const fs = require('fs')

let isStart: boolean = false;
function updateStatus(status: any) {
  if (isStart === false) {
    window['eventBus'].$emit('status', status)
  }
}

@injectable
export class ResourceService{
  constructor(pipeline: MessagePipeline, observer: ResourceObserver) {
    this.observer = observer
    this.pipeline = pipeline
    pipeline.regist('addImagesByDirectory', this.addFilesByDir, this)
    pipeline.regist('addImagesByPaths', this.addImagesByPaths, this)
    pipeline.regist('getImagesInfo', this.getImagesInfo, this)
    pipeline.regist('getFilesSnap', this.getFilesSnap, this)
    pipeline.regist('getImageInfo', this.getImageInfo, this)
    pipeline.regist('setTag', this.setTag, this)
    pipeline.regist('removeFiles', this.removeFiles, this)
    pipeline.regist('removeTag', this.removeTag, this)
    pipeline.regist('removeClasses', this.removeClasses, this)
    pipeline.regist('getAllTags', this.getAllTags, this)
    pipeline.regist('getAllCategory', this.getAllCategory, this)
    pipeline.regist('getAllTagsWithImages', this.getAllTagsWithImages, this)
    pipeline.regist('queryFiles', this.queryFiles, this)
    pipeline.regist('addCategory', this.addCategory, this)
    pipeline.regist('getCategoryDetail', this.getCategoryDetail, this)
    pipeline.regist('getUncategoryImages', this.getUncategoryImages, this)
    pipeline.regist('getUntagImages', this.getUntagImages, this)
    pipeline.regist('updateCategoryName', this.updateCategoryName, this)
    pipeline.regist('updateFileName', this.updateFileName, this)
    pipeline.regist('reInitDB', this.reInitDB, this)
    pipeline.regist('removeDB', this.removeDB, this)
  }

  private addFilesByDir(msgid: number, dir: string) {
    let self = this;
    fs.readdir(dir, async function(err: any, menu: any) {
      if (err) return
      // console.info(menu)
      self.totalFiles += menu.length
      for (const item of menu) {
        await self.readImages(msgid, new ResourcePath(joinPath(dir, item)))
      }
      // reply2Renderer(ReplyType.REPLY_FILES_LOAD_COUNT, { count: menu.length, total: totalFiles })
      self.progressLoad += menu.length
      if (self.progressLoad === self.totalFiles) {
        self.totalFiles = 0
        self.progressLoad = 0
      }
    })
  }

  private addImagesByPaths(msgid: number, data: string[]) {
    for (const fullpath of data) {
      this.readImages.call(this, msgid, new ResourcePath(fullpath))
    }
  }

  getImagesInfo(msgid: number, data: any) {
    updateStatus('reading files')
    let imagesIndex = []
    if (data === undefined) {
      // 全部图片信息
      const imagesSnap = CivetDatabase.getFilesSnap(undefined)
      for (const imgID in imagesSnap) {
        imagesIndex.push(imgID)
      }
    } else {
      imagesIndex = data
    }
    const imgs = CivetDatabase.getFilesInfo(imagesIndex)
    console.info('getImagesInfo', imgs, this)
    const images = []
    for (const img of imgs) {
      let resource = new Resource(img)
      const thumbnail = readThumbnail(resource.thumbnail)
      resource.putProperty({name: 'thumbnail', value: thumbnail, type: PropertyType.Binary, query: false, store: true})
      images.push(resource)
    }
    return {type: ReplyType.REPLY_IMAGES_INFO, data: images}
    // reply2Renderer(ReplyType.REPLY_IMAGES_INFO, images)
  }

  getFilesSnap(msgid: number, data: any) {
    // 全部图片信息
    const imagesSnap = CivetDatabase.getFilesSnap(undefined)
    return {type: ReplyType.REPLY_FILES_SNAP, data: imagesSnap}
    // reply2Renderer(ReplyType.REPLY_FILES_SNAP, imagesSnap)
  }

  getImageInfo(msgid: number, imageID: number) {
    const img = CivetDatabase.getFilesInfo([imageID])
    console.info('getImagesInfo', img)
    // let blob = new Blob([file.thumbnail], { type: 'image/jpeg' })
    //     let reader = new FileReader()
    //     reader.onload = function(e) {
    //       this.thumbnail = e.target.result
    //       console.info('this.thumbnail', this.thumbnail)
    //     }
    // reader.readAsDataURL(blob)
    const image = new Resource(img[0])
    // reply2Renderer(ReplyType.REPLY_IMAGE_INFO, image)
    return {type: ReplyType.REPLY_IMAGE_INFO, data: image}
  }
  setTag(msgid: number, data: any) {
    console.info(data)
    CivetDatabase.setTags(data.id, data.tag)
  }
  removeFiles(msgid: number, filesID: any) {
    console.info('removeFiles:', filesID)
    CivetDatabase.removeFiles(filesID)
  }
  removeTag(msgid: number, data: any) {
    console.info(data)
    CivetDatabase.removeTags(data.filesID, data.tag)
  }
  removeClasses(msgid: number, mutation: any) {
    console.info('removeClasses', mutation)
    CivetDatabase.removeClasses(mutation)
  }
  getAllTags(msgid: number, data: any) {
    const allTags = CivetDatabase.getAllTags()
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS, allTags)
    return {type: ReplyType.REPLY_ALL_TAGS, data: allTags}
  }
  getAllTagsWithImages(msgid: number, data: any) {
    const allTags = CivetDatabase.getTagsOfFiles(data)
    console.info('allTags', allTags)
    // reply2Renderer(ReplyType.REPLY_ALL_TAGS_WITH_IMAGES, allTags)
  }
  queryFiles(msgid: number, nsql: any) {
    console.info('query:', nsql)
    const allFiles = CivetDatabase.query(nsql)
    console.info('reply: ', allFiles)
    // reply2Renderer(ReplyType.REPLY_QUERY_FILES, allFiles)
    return {type: ReplyType.REPLY_QUERY_FILES, data: allFiles}
  }
  addCategory(msgid: number, mutation: any) {
    console.info('add class', mutation)
    if (typeof mutation === 'string') {
      mutation = [mutation]
    }
    CivetDatabase.addClasses(mutation)
  }
  getAllCategory(msgid: number, parent: any) {
    const category = CivetDatabase.getClasses('/')
    // let category = await CategoryArray.loadFromDB()
    console.info('getAllCategory', category)
    // reply2Renderer(ReplyType.REPLAY_ALL_CATEGORY, category)
    return {type: ReplyType.REPLAY_ALL_CATEGORY, data: category}
  }
  getCategoryDetail(msgid: number, parent: any) {
    const category = CivetDatabase.getClassDetail(parent)
    // let category = await CategoryArray.loadFromDB()
    console.info('getCategoryDetail', category)
    // reply2Renderer(ReplyType.REPLY_CLASSES_INFO, category)
    return {type: ReplyType.REPLY_CLASSES_INFO, data: category}
  }
  async getUncategoryImages(msgid: number, data: any) {
    updateStatus('reading unclassify info')
    const uncateimgs = CivetDatabase.getUnClassifyFiles()
    console.info('ppopopo', data)
    // reply2Renderer(ReplyType.REPLY_UNCATEGORY_IMAGES, uncateimgs)
    console.info('unclasses', uncateimgs)
    return {type: ReplyType.REPLY_UNCATEGORY_IMAGES, data: uncateimgs}
  }
  getUntagImages() {
    updateStatus('reading untag info')
    const untagimgs = CivetDatabase.getUnTagFiles()
    // reply2Renderer(ReplyType.REPLY_UNTAG_IMAGES, untagimgs)
    console.info('untag', untagimgs)
    return {type: ReplyType.REPLY_UNTAG_IMAGES, data: untagimgs}
  }
  // updateImageCategory(msgid: number, data: any) {
  //   storage.updateFileClass(data.imageID, data.category)
  // }
  updateCategoryName(msgid: number, data: any) {
    console.info('old:', data.oldName, 'new:', data.newName)
    CivetDatabase.updateClassName(data.oldName, data.newName)
  }
  updateFileName(msgid: number, data: any) {
    console.info('updateFileName id:', data.id, 'new:', data.filename)
    // {id: [fileids[0]], filename: '测试'}
    CivetDatabase.updateFile({ id: [data.id], filename: data.filename })
  }
  async reInitDB(msgid: number, data: any) {
    console.info('init db', data)
    CivetDatabase.reload()
    this.observer.switchResourceDB(data)
    // reply2Renderer(ReplyType.REPLY_RELOAD_DB_STATUS, true)
    return {type: ReplyType.REPLY_RELOAD_DB_STATUS, data: true}
  }

  removeDB(msgid: number, data: any) {
    console.info('remove db', data)
    if (data === config.getCurrentDB()) {
      CivetDatabase.release()
    }
    // remove db
    // config.removeResource(data)
  }

  error(msg: string|null) {
    this.pipeline.error(msg)
  }

  async readImages(msgid: number, resourcePath: ResourcePath) {
    const info = fs.statSync(resourcePath.local())
    if (info.isDirectory()) {
      this.readDir.call(this, msgid, resourcePath)
    } else {
      const result = await this.observer.read(resourcePath)
      console.info(result)
      if (result.isSuccess()) {
        let resource = <Resource>result.value
        let msg = new Message()
        msg.type = ReplyType.WORKER_UPDATE_IMAGE_DIRECTORY
        const accessor = new SerializeAccessor()
        msg.msg = [resource.toJson(accessor)]
        msg.tick = 0
        msg.id = msgid
        console.info('reply file')
        this.pipeline.reply(msg)
      }
    }
  }

  private readDir(msgid: number, path: ResourcePath) {
    let self = this;
    fs.readdir(path.local(), async function(err: any, menu: any) {
      if (err) return
      // console.info(menu)
      self.totalFiles += menu.length
      for (const item of menu) {
        await self.readImages(msgid, new ResourcePath(joinPath(path.local(), item), path.remote()))
      }
      // reply2Renderer(ReplyType.REPLY_FILES_LOAD_COUNT, { count: menu.length, total: totalFiles })
      self.progressLoad += menu.length
      if (self.progressLoad === self.totalFiles) {
        self.totalFiles = 0
        self.progressLoad = 0
      }
    })
  }

  private pipeline: MessagePipeline;
  private totalFiles: number = 0;
  private progressLoad: number = 0;
  private observer: ResourceObserver;
}