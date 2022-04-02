import { config } from '../public/CivetConfig'
import { PerformanceObserver, performance } from 'perf_hooks'

enum OpenFlag {
  ReadWrite = 0,
  ReadOnly
}

let _instance: any;
let _current: string|undefined = undefined;
let _flag: OpenFlag = OpenFlag.ReadWrite;
const _enableLog: boolean = false;

function Benchmark(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  Initialze()
  const primitive = descriptor.value
  descriptor.value = function (...args: any) {
    performance.mark(`${propertyKey} begin`)
    const result = primitive(...args)
    performance.mark(`${propertyKey} end`)
    performance.measure(`${propertyKey} time:`, `${propertyKey} begin`, `${propertyKey} end`)
    return result
  }
  return descriptor
}
function Initialze() {
  if (!_current) {
    _instance = require('civetkern').civetkern
    const c = config.getConfig(true)
    _current = config.getCurrentDB()
    try{
      const messageObs = new PerformanceObserver((items) => {
        const measurements = items.getEntriesByType('measure');
        measurements.forEach(measurement => {
          console.debug('performance', measurement.name, measurement.duration)
        })
      })
      messageObs.observe({ entryTypes: ['measure'] })

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

  @Benchmark
  static getFilesSnap(flag: any): any {
    return _instance.getFilesSnap(flag)
  }
  
  @Benchmark
  static getFilesInfo(filesID: number[]) {
    return _instance.getFilesInfo(filesID)
  }

  @Benchmark
  static getUnTagFiles() {
    return _instance.getUnTagFiles()
  }

  @Benchmark
  static getUnClassifyFiles() {
    return _instance.getUnClassifyFiles()
  }
  @Benchmark
  static getClasses(parent: string) {
    return _instance.getClasses(parent)
  }
  @Benchmark
  static getClassDetail(category: any) {
    return _instance.getClassesInfo(category)
  }
  @Benchmark
  static getAllTags() {
    return _instance.getAllTags()
  }
  @Benchmark
  static query(sql: any) {
    return _instance.query(sql)
  }
  static insert(sql: any) {
    Initialze()
  }
  static update(sql: any) {}
  static remove(sql: any) {}
  @Benchmark
  static getTagsOfFiles(filesID: number[]) {
    return _instance.getTagsOfFiles({id: filesID})
  }
  @Benchmark
  static writeLog(str: string) {
    _instance.writeLog(str)
  }
  @Benchmark
  static generateFilesID(num: number) {
    return _instance.generateFilesID(num)
  }
  @Benchmark
  static addFiles(src: any) {
    return _instance.addFiles(src)
  }
  @Benchmark
  static addMeta(filesID: number[], meta: any) {
    return _instance.addMeta({id: filesID, meta: meta})
  }
  @Benchmark
  static removeFiles(filesID: number[]) {
    _instance.removeFiles(filesID)
  }
  @Benchmark
  static setTags(filesID: number[], tags: string[]) {
    return _instance.setTags({ id: filesID, tag: tags })
  }
  @Benchmark
  static removeTags(filesID: number[], tags: string[]) {
    return _instance.removeTags({ id: filesID, tag: tags })
  }
  @Benchmark
  static addClasses(sql: any) {
    return _instance.addClasses(sql)
  }
  @Benchmark
  static removeClasses(classes: any) {
    return _instance.removeClasses(classes)
  }
  @Benchmark
  static updateFile(sql: any) {
    return _instance.updateFile(sql)
  }
  @Benchmark
  static updateClassName(classPath: string, newPath: string) {
    return _instance.updateClassName(classPath, newPath)
  }
  @Benchmark
  static release() {
    _instance.release()
  }

  private constructor(){}
}
