// import { debounce } from 'lodash'
import { config } from '@/../public/CivetConfig'
import { localKey } from '@/../public/Utility'

class Accelerator{
  private _shortcut: Map<string, [(...args: Array<any>) => boolean, any]> = new Map();
  register(shortcut: string, when: string, func: (...args: Array<any>) => boolean ) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      console.warn(`shortcut ${shortcut} will be replace`)
    }
    this._shortcut.set(lower, [func, when])
  }

  unregister(shortcut: string) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      this._shortcut.delete(lower)
    }
  }

  updateKey(old: string, current: string) {
    const lower = old.toLowerCase()
    const lowerCurrent = current.toLowerCase()
    if (this._shortcut.has(lower)) {
      const record = this._shortcut.get(lower)!
      if (this._shortcut.has(lowerCurrent)) {
        console.warn(`shortcut ${lowerCurrent} is confict`)
        const history = this._shortcut.get(lowerCurrent)
        this._shortcut.set('old.' + lowerCurrent, history!)
      }
      this._shortcut.set(lowerCurrent, record)
      this._shortcut.delete(lower)
      // console.debug('update key:', lower, 'with', lowerCurrent, this._shortcut)
    }
  }

  has(shortcut: string) {
    return this._shortcut.has(shortcut)
  }

  get(shortcut: string) {
    return this._shortcut.get(shortcut)
  }
}

let pressedKey: string[] = []
let shortcut: Accelerator = new Accelerator()

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
    if (shortcut.has(accelerator)) {
      const [func, when] = shortcut.get(accelerator)!
      return func(when)
    }
    console.debug('short key not exist:', accelerator)
    return false
  }
})()

document.addEventListener('keydown', keyDownHandler)
document.addEventListener('keyup', keyUpHandler)

function keyUpHandler(event: any) {
  const key = localKey(event.key).toLowerCase()
  if (!hasKey(key)) return false
  removeKey(key)
  console.info('keyUpHandler:', event)
  return false
}

export const Shortcut = shortcut