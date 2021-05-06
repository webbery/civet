import { config } from '../public/CivetConfig'

enum OpenFlag {
  ReadWrite = 0,
  ReadOnly
}


let _instance: any;
let _current: string|undefined = undefined;
let _flag: OpenFlag = OpenFlag.ReadWrite;
const _enableLog: boolean = true;

function Initialze() {
  if (!_current) {
    _instance = require('civetkern').civetkern
    const c = config.getConfig(true)
    _current = config.getCurrentDB()
    _instance.init(c, _flag, _enableLog)
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
    return _instance.addFiles(src)
  }
  static addMeta(filesID: number[], meta: any) {
    Initialze()
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

// const kernel = (function () {
//   let instance
//   let _isInit = false
//   let flag = 0
//   let current = config.getCurrentDB()
//   function _init(cfg) {
//     try {
//       if (!instance.civetkern.init(cfg, flag, true)) {
//         console.info('init fail')
//         return false
//       }
//       // if (!cfg.isDBExist(name)) {
//       //   console.info('db not exist')
//       //   return false
//       // }
//       _isInit = true
//       console.info(cfg, flag, instance.civetkern)
//       return true
//     } catch (exception) {
//       console.info('init civetkern exception:', exception)
//     }
//   }
//   function _release() {
//     instance.civetkern.release()
//   }
//   try {
//     instance = require('civetkern')
//     if (process.argv[process.argv.length - 1] === 'renderer') {
//       flag = 1
//     }
//     return function() {
//       const cfg = config.getConfig(true)
//       if (cfg.resources.length === 0) return null
//       if (current !== undefined && cfg.app.default !== current) {
//         _release(current)
//       }
//       if (!_isInit || cfg.app.default !== current) {
//         if (!_init(cfg)) return null
//       }
//       return instance.civetkern
//     }
//   } catch (ex) {
//     console.error(ex)
//   }
// })()

// function zipFile(input) {
//   const fs = require('fs')
//   const inputStream = fs.createReadStream(input)
//   const zlib = require('zlib')
//   const gz = zlib.createGzip()
//   const stream = require('stream')
//   stream.pipeline(inputStream, gz, fs.createWriteStream(input + '.gz'), (err) => {
//     if (err) {
//       console.info('zlib error:', err)
//     }
//   })
// }

// global.zipFile = zipFile

// export default {
//   init: (name) => {
//     kernel(name)
//   },
//   getFilesSnap: (flag) => {
//     return kernel().getFilesSnap(flag)
//   },
//   getFilesInfo: (filesID) => { return kernel().getFilesInfo(filesID) },
//   getUnTagFiles: () => { return kernel().getUnTagFiles() },
//   getUnClassifyFiles: () => { return kernel().getUnClassifyFiles() },
//   getClasses: (parent) => { return kernel().getClasses(parent) },
//   getClassDetail: (category) => { return kernel().getClassesInfo(category) },
//   getAllTags: () => { return kernel().getAllTags() },
//   query: (condition) => { return kernel().query(condition) },
//   getTagsOfFiles: (filesID) => { return kernel().getTagsOfFiles({id: filesID}) },
//   writeLog: (str) => { kernel.writeLog(str) },
//   // 以下接口为可写接口
//   generateFilesID: (num) => { return kernel().generateFilesID(num) },
//   addFiles: (src) => { return kernel().addFiles(src) },
//   addMeta: (filesID, meta) => { return kernel().addMeta({id: filesID, meta: meta}) },
//   removeFiles: (filesID) => { kernel().removeFiles(filesID) },
//   setTags: (filesID, tags) => { return kernel().setTags({ id: filesID, tag: tags }) },
//   removeTags: (filesID, tags) => { return kernel().removeTags({ id: filesID, tag: tags }) },
//   addClasses: (sql) => { return kernel().addClasses(sql) },
//   removeClasses: (classes) => { return kernel().removeClasses(classes) },
//   updateFile: (sql) => { return kernel().updateFile(sql) },
//   updateClassName: (classPath, newPath) => { return kernel().updateClassName(classPath, newPath) },
//   release: () => {
//     kernel().release()
//   }
// }
