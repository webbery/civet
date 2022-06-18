// import { debounce } from 'lodash'
import { config } from '@/../public/CivetConfig'
import { localKey } from '@/../public/Utility'

let pressedKey: string[] = []

function hasKey(key: string) {
  for (const item of pressedKey) {
    if (item === key) return true
  }
  return false
}

function removeKey(key: string) {
  for (let idx = pressedKey.length - 1; idx >= 0; --idx) {
    if (pressedKey[idx] === key) {
      pressedKey.splice(idx, 1)
      return
    }
  }
}

const keyDownHandler = (() => {
  return function (event: any) {
    const key = localKey(event.key).toLowerCase()
    // console.info('key:', event.key, key)
    if (hasKey(key)) {
      return false
    }
    pressedKey.push(key)
    console.info('keyDownHandler:', pressedKey)
    let accelerator = pressedKey.join('+')
    if (Shortcut.has(accelerator)) {
      const func = Shortcut.get(accelerator)
      if (func) return func()
    }
    return false
  }
})()

document.addEventListener('keydown', keyDownHandler)
document.addEventListener('keyup', keyUpHandler)

export class Shortcut{
  private static _shortcut: Map<string, (...args: Array<any>) => boolean> = new Map();
  static register(shortcut: string, func: (...args: Array<any>) => boolean ) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      console.warn(`shortcut ${shortcut} will be replace`)
    }
    this._shortcut.set(lower, func)
  }

  static unregister(shortcut: string) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      this._shortcut.delete(lower)
    }
  }

  static has(shortcut: string) {
    return this._shortcut.has(shortcut)
  }

  static get(shortcut: string) {
    return this._shortcut.get(shortcut)
  }
}

function keyUpHandler(event: any) {
  const key = localKey(event.key).toLowerCase()
  if (!hasKey(key)) return false
  removeKey(key)
  console.info('keyUpHandler:', event)
  return false
}
