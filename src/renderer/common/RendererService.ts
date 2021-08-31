import { ViewType } from '@/../public/ExtensionHostType'
import { IPCExtensionMessage, IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import util from 'util'

type IPCType = IPCExtensionMessage|IPCNormalMessage;
type NormalMessageCallback = (session: number, reply: any) => void;
type WorkbenchExtensionMessageCallback = (session: number, id: string, classname: string, html: string) => void;
type MessageCallback = NormalMessageCallback|WorkbenchExtensionMessageCallback;

/**
 * when a message is recieved from worker, its id will split to node path in order to find response callback. 
 */
class MessageTree {
  /**
   * cache is an array, which index points to its level.
   * For example, cache 0 is cache[0], which tree depth is 1
   */
  private cache: Array<Map<string, MessageCallback[]>>;
  private maxLevel: number = 4;

  constructor() {
    this.cache = new Array<Map<string, MessageCallback[]>>();
    for (let level = 0; level < this.maxLevel; ++level) {
      const cache = new Map<string, Array<MessageCallback>>();
      this.cache.push(cache)
    }
  }

  regist<Reply>(type: string, callback: MessageCallback): boolean {
    if (!type) return false
    const path = type.split('.')
    if (path.length > this.maxLevel) return false
    let callbacks = this.cache[path.length][type]
    if (!callbacks) {
      this.cache[path.length - 1][type] = [callback]
    } else {
      this.cache[path.length - 1][type].push(callback)
      console.info(`regist ${type} count: ${this.cache[path.length - 1][type].length}`)
    }
    return true
  }

  get(type: string): MessageCallback[]|undefined {
    if (!type) return undefined
    const path = type.split('.')
    if (path.length > this.maxLevel) return undefined
    return this.cache[path.length - 1][type]
  }
}

class RendererService {
  private session: number;
  private ipc: Electron.IpcRenderer;
  // private response: Map<IPCType, any>;
  private response: MessageTree = new MessageTree();

  constructor() {
    const { ipcRenderer } = require('electron')
    this.ipc = ipcRenderer
    this.session = 0
    const self = this
    this.ipc.on('message-to-renderer', (sender, msg) => {
      const types = msg.type.split('.')
      const callbacks = self.response.get(types[0])
      if (callbacks === undefined) return
      switch(types.length) {
      case 1:
        callbacks.forEach((callback: any) => {
          console.info('message:', msg.data.msg)
          callback(msg.dataid, msg.data.msg[0])
        })
        break
      case 3:
        console.info('+=+', msg)
        callbacks.forEach((callback: any) => {
          callback(msg.data.id, types[2], types[1], msg.data.msg[0])
        })
        break
      case 4:
        callbacks.forEach((callback: any) => {
          callback(msg.data.id, types[2], types[1], types[3], msg.data.msg[0])
        })
        break
      default:
        break;
      }
    })
  }

  send(type: string, message: any) {
    this.session += 1
    console.info('message-from-renderer: type=' + type + ', data', message)
    this.ipc.send('message-from-renderer', {
      id: this.session,
      type: type,
      data: message
    })
    return this.session
  }

  /**
   * regist reply function from remote service. In order to reduce ipc frequency, some message will discard or merge:
   * discard message:
   *  1. 
   * merge message:
   *  1.
   * @param type denote message steam is extension or others
   * @param callback meesage callback, session is id
   */
  on<Reply>(type: IPCType, callback: (session: number, reply: Reply) => void) {
    this.response.regist(type, callback)
  }

  async get(type: IPCType, params: any): Promise<any> {
    this.send(type, params)
    if (IPCRendererResponse[type] === undefined) {
      console.error(`reply[${type}] is not defined, params: ${params}`)
    }
    const promiseOn = util.promisify(this.on)
    const result = await promiseOn.call(this, IPCRendererResponse[type])
    return result
  }
}
export const service = new RendererService();