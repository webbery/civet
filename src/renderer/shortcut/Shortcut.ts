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
      const [func, when] = Shortcut.get(accelerator)!
      return func(when)
    }
    return false
  }
})()

document.addEventListener('keydown', keyDownHandler)
document.addEventListener('keyup', keyUpHandler)

export class Shortcut{
  private static _shortcut: Map<string, [(...args: Array<any>) => boolean, any]> = new Map();
  static register(shortcut: string, when: string, func: (...args: Array<any>) => boolean ) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      console.warn(`shortcut ${shortcut} will be replace`)
    }
    this._shortcut.set(lower, [func, when])
  }

  static unregister(shortcut: string) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      this._shortcut.delete(lower)
    }
  }

  static updateKey(old: string, current: string) {
    const lower = old.toLowerCase()
    if (this._shortcut.has(lower)) {
      const record = this._shortcut[lower]
      if (this._shortcut.has(current)) {
        console.warn(`shortcut ${current} is confict`)
        const history = this._shortcut[current]
        this._shortcut['old.' + current] = history
      }
      this._shortcut[current] = record
      delete this._shortcut[lower]
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
