import { config } from '../public/CivetConfig'

enum OpenFlag {
  ReadWrite = 0,
  ReadOnly
}


let _instance: any;
let _current: string|undefined = undefined;
let _flag: OpenFlag = OpenFlag.ReadWrite;
const _enableLog: boolean = false;

function Initialze() {
  if (!_current) {
    _instance = require('civetkern').civetkern
    const c = config.getConfig(true)
    _current = config.getCurrentDB()
    try{
      _instance.init(c, _flag, _enableLog)
    } catch(err) {
      console.error('config is', c)
      console.error(err)
    }
  }
  // console.info('_instance', _instance)
}

export class CivetDatabase {
  static reload() {
    const cfg = config.getConfig(true)
    if (_current !== undefined && _current !== config.getCurrentDB()) {
      _current = config.getCurrentDB()
      _instance.release()
    }
    _instance.init(cfg, _flag, _enableLog)
    console.info('reload database', _current, cfg)
  }

  
  static getFilesSnap(flag: any): any {
    Initialze()
    return _instance.getFilesSnap(flag)
  }
  
  static getFilesInfo(filesID: number[]) {
    Initialze()
    return _instance.getFilesInfo(filesID)
  }

  static getUnTagFiles() {
    Initialze()
    return _instance.getUnTagFiles()
  }
  static getUnClassifyFiles() {
    Initialze()
    return _instance.getUnClassifyFiles()
  }
  static getClasses(parent: string) {
    Initialze()
    return _instance.getClasses(parent)
  }
  static getClassDetail(category: any) {
    Initialze()
    return _instance.getClassesInfo(category)
  }
  static getAllTags() {
    Initialze()
    return _instance.getAllTags()
  }
  static query(sql: any) {
    Initialze()
    return _instance.query(sql)
  }
  static insert(sql: any) {
    Initialze()
  }
  static update(sql: any) {}
  static remove(sql: any) {}
  static getTagsOfFiles(filesID: number[]) {
    Initialze()
    return _instance.getTagsOfFiles({id: filesID})
  }
  static writeLog(str: string) {
    Initialze()
    _instance.writeLog(str)
  }
  static generateFilesID(num: number) {
    Initialze()
    return _instance.generateFilesID(num)
  }
  static addFiles(src: any) {
    Initialze()
    console.info('add Files:', src)
    return _instance.addFiles(src)
  }
  static addMeta(filesID: number[], meta: any) {
    Initialze()
    console.info('add Meta:', filesID, meta)
    return _instance.addMeta({id: filesID, meta: meta})
  }
  static removeFiles(filesID: number[]) {
    Initialze()
    _instance.removeFiles(filesID)
  }
  static setTags(filesID: number[], tags: string[]) {
    Initialze()
    return _instance.setTags({ id: filesID, tag: tags })
  }
  static removeTags(filesID: number[], tags: string[]) {
    Initialze()
    return _instance.removeTags({ id: filesID, tag: tags })
  }
  static addClasses(sql: any) {
    Initialze()
    return _instance.addClasses(sql)
  }
  static removeClasses(classes: any) {
    Initialze()
    return _instance.removeClasses(classes)
  }
  static updateFile(sql: any) {
    Initialze()
    return _instance.updateFile(sql)
  }
  static updateClassName(classPath: string, newPath: string) {
    Initialze()
    return _instance.updateClassName(classPath, newPath)
  }
  static release() {
    _instance.release()
  }

  private constructor(){}
}
