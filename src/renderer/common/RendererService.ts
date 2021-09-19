import { ViewType } from '@/../public/ExtensionHostType'
import { IPCExtensionMessage, IPCNormalMessage, IPCRendererResponse } from '@/../public/IPCMessage'
import util from 'util'

type IPCType = IPCExtensionMessage|IPCNormalMessage;
type NormalMessageCallback = (session: number, reply: any) => void;
type WorkbenchExtensionMessageCallback = (session: number, id: string, classname: string, html: string) => void;
type MessageCallback = NormalMessageCallback|WorkbenchExtensionMessageCallback;

declare let _cv_message_id_: number;
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
  // private session: number;
  private ipc: Electron.IpcRenderer;
  // private response: Map<IPCType, any>;
  private response: MessageTree = new MessageTree();

  constructor() {
    const { ipcRenderer } = require('electron')
    this.ipc = ipcRenderer
    // this.session = 0
    const self = this
    this.ipc.on('message-to-renderer', (sender, msg) => {
      const types = msg.type.split('.')
      const callbacks = self.response.get(types[0])
      console.info('callbacks:', callbacks)
      if (callbacks === undefined) return
      callbacks.forEach((callback: any) => {
        switch(callback.length) {
          case 2:
            callback(msg.data.id, msg.data.msg)
            break
          case 3:
            callback(msg.data.id, types[2], types[1], msg.data.msg[0])
            break
          case 5:
            if (Array.isArray(msg.data.msg)) {
              callback(msg.data.id, types[2], types[1], types[3], msg.data.msg[0])
            } else {
              callback(msg.data.id, types[2], types[1], types[3], msg.data.msg)
            }
            break
          default: break
        }
      })
    })
  }

  send(type: string, message: any) {
    _cv_message_id_ += 1
    console.info('message-from-renderer: type=' + type + ', data', message)
    this.ipc.send('message-from-renderer', {
      id: _cv_message_id_,
      type: type,
      data: message
    })
    return _cv_message_id_
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

  private stdOn<Reply>(type: IPCType, callback: (err: any, resp: {session: number, reply: Reply}) => void) {
    const func = (session: number, reply: Reply) => {
      // console.info('reply:', 0, reply)
      return callback(0, {session, reply})
    }
    this.response.regist(type, func)
  }

  async get(type: IPCType, params: any): Promise<any> {
    this.send(type, params)
    if (IPCRendererResponse[type] === undefined) {
      console.error(`reply[${type}] is not defined, params: ${params}`)
    }
    // this.stdOn(IPCRendererResponse[type], (err, reply) => {
    //   console.info('reply:', err, reply)
    // })
    const promiseOn = util.promisify(this.stdOn)
    // const result = await promiseOn(IPCRendererResponse[type])
    const result = await promiseOn.call(this, IPCRendererResponse[type])
    // console.info('promise on', result)
    return result.reply
  }
}

declare const _cv_events: any;
export const events = _cv_events;
export const service = new RendererService();

