// import { debounce } from 'lodash'
import { localKey } from '@/../public/Utility'
import { IClientCommand } from '../common/CommandService'

export interface IKeyBindingRules {
  key: string,
  command: IClientCommand;
}

/**
 * this manager is a Map, which key is extension, value is callback and `when`
 */
type CommandHandlerManager = Map<string, [(...args: Array<any>) => boolean, string]>

class Accelerator{
  private _shortcut: Map<string, CommandHandlerManager> = new Map();
  /**
   * 
   * @param shortcut A shortcut which format as: key
   * @param when 
   * @param func a callback handler that key is press
   */
  register(shortcut: string, extension: string, when: string, func: (...args: Array<any>) => boolean ) {
    const lower = shortcut.toLowerCase()
    let handlers = this._shortcut.get(lower)
    if (!handlers) {
      handlers = new Map
    } else {
      console.warn(`shortcut ${shortcut},${extension} will be replace`)
    }
    handlers.set(extension, [func, when])
    console.debug('regist keybinding:', shortcut, extension, func)
    this._shortcut.set(lower, handlers)
  }

  unregister(shortcut: string, extension: string) {
    const lower = shortcut.toLowerCase()
    if (this._shortcut.has(lower)) {
      let handler = this._shortcut.get(lower)
      if (handler && handler.has(extension)) {
        handler.delete(extension)
      }
      if (handler && handler.size === 0) {
        this._shortcut.delete(lower)
      }
    }
  }

  /**
   * @brief update keybinding, use `current` replace `old`.
   * @param old the key that will be replaced. 
   * @param current the key to replace.
   */
  updateKey(old: string, current: string, extension: string) {
    const lower = old.toLowerCase()
    let handler = null
    // get original handler and remove old keybind
    if (this._shortcut.has(lower)) {
      const record = this._shortcut.get(lower)!
      if (record && record.has(extension)) {
        handler = record.get(extension)
        record.delete(extension)
      }
      if (record && record.size === 0) {
        this._shortcut.delete(lower)
      }
      // console.debug('update key:', lower, 'with', lowerCurrent, this._shortcut)
    }
    // set new keybind
    const lowerCurrent = current.toLowerCase()
    let currentManager = this._shortcut.get(lowerCurrent)
    if (!currentManager) {
      currentManager = new Map
    }
    if (currentManager.has(extension)) {
      console.warn(`some keybind will be replace`)
    }
    currentManager.set(extension, handler!)
    this._shortcut.set(lowerCurrent, currentManager)
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

/**
 * @brief this function is added to event listener when key is press down in App.vue
 * @param vue an vue instance
 * @returns an event listener function
 */
export const keyDownHandler = function (vue: any) {
  return function(event: any) {
    const key = localKey(event.key).toLowerCase()
    // console.info('key:', event.key, key)
    if (hasKey(key)) {
      return false
    }
    const focus = vue.$store.getters.focusElement
    console.debug('keyDownHandler', focus)
    if (focus === null) {
      console.debug('focus element is null')
      return false
    }
    pressedKey.push(key)
    console.info('keyDownHandler:', pressedKey)
    let accelerator = pressedKey.join('+')
    if (shortcut.has(accelerator)) {
      const manager = shortcut.get(accelerator)!
      const extension = vue.$store.getters.extensionName(focus.id)
      const [func, when] = manager.get(extension)!
      return func(when)
    }
    console.debug('short key not exist:', accelerator, shortcut)
    return false
  }
}

document.addEventListener('keyup', keyUpHandler)

function keyUpHandler(event: any) {
  const key = localKey(event.key).toLowerCase()
  if (!hasKey(key)) return false
  removeKey(key)
  console.info('keyUpHandler:', event)
  return false
}

export const Shortcut = shortcut