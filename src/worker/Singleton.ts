import 'reflect-metadata'
import { logger } from 'public/Logger';

const registClasses = new Array<any>();
const serviceIds = new Map<string, any>();

export function getSingleton<T>(ctor: { new (...args: Array<any>): T }): T | undefined {
  const id = (ctor as any).name
  if (serviceIds[id] !== undefined) return serviceIds[id]
  return undefined
}

export function injectable<T>(ctor: T) {
  let paramsTypes = Reflect.getMetadata('design:paramtypes', ctor)
  if (registClasses.indexOf(ctor) !== -1) return
  if (paramsTypes && paramsTypes.length) {
    paramsTypes.forEach((v: any, i: any) => {
      if (v === ctor) {
        throw new Error('self dependency')
      }
    })
  }
  registClasses.push(ctor)
}

function checkBasicType<T>(v: T): boolean {
  const t = (v as any).name
  switch(t) {
    case 'Number': return true;
    default:
      return false;
  }
}

export function registSingletonObject<T>(ctor: { new (...args: Array<any>): T }, ...args: any): T {
  const id = (ctor as any).name
  if (serviceIds[id] !== undefined) return serviceIds[id]
  let paramsTypes = Reflect.getMetadata('design:paramtypes', ctor)
  if (!paramsTypes) {
    logger.warn(`class ${id} has empty params`)
    const instance = new ctor()
    serviceIds[id] = instance
    return instance
  }
  let paramInstances = paramsTypes.map((v: any, i: any) => {
    const vid = (v as any).name
    // let vins = serviceIds[vid]
    // if (vins !== undefined) return vins
    // if (v.length) {
    //   return registSingletonObject(v)
    // }
    if (registClasses.indexOf(v) === -1) {
      if (args.length === 0) {
        if (checkBasicType(v)) {
          return v
        }
        throw new Error(`params[${i}]: class ${(v as any).name} is not injected`)
      }
      return args
    } else if (v.length) {
      return registSingletonObject(v)
    } else {
      let vi = serviceIds[(v as any).name]
      if (!vi) {
        vi = new (v as any)()
        serviceIds[(v as any).name] = vi
      }
      return vi
    }
  })
  const instance = new ctor(...paramInstances)
  console.info(`new singlecton: ${id}`)
  serviceIds[id] = instance
  return instance
}
