import { ReplyType, Message, MessageState, IMessagePipeline } from './Message'
const { ipcRenderer } = require('electron')

class Timer {
  handle: any = null;
  start(func: any, tick: any) {
    const task = () => {
      // 执行一次func, 然后定时执行func
      func()
      if (this.handle === null) {
        this.handle = setInterval(func, tick)
        console.info('start timer')
      }
    }
    if (this.handle === null) setImmediate(task)
  }
  stop() {
    if (this.handle !== null) {
      clearTimeout(this.handle)
      this.handle = null
      console.info('stop timer')
    }
  }
}

  const timer = new Timer();

  interface IMessageCallback {
    (id: number, data: any): void;
  }

  export class MessagePipeline implements IMessagePipeline {
    threshod: number = 200;
    messageQueue: Map<string, Message> = new Map<string, Message>();
    processor: Map<string, any> = new Map<string, any>();
    constructor(threshod: number, processor: Map<string, any>) {
      this.threshod = threshod
      this.processor = processor

      ipcRenderer.on('message-from-main', async (event: any, arg: any) => {
        console.info('==================')
        console.info('arg', arg)
        console.info('==================')
        const [func, self] = this.processor.get(arg.type)
        const reply = await func.call(self, arg.id, arg.data)
        console.info('replay', reply)
        if (reply === undefined) return
        let msg = new Message()
        msg.id = arg.id
        msg.type = reply.type
        msg.msg = reply.data
        msg.tick = 0
        this.post(msg)
      })
    }
    post(msg: Message) {
      // if same type exist but id is different, remove smaller id message.
      for (let k of this.messageQueue.keys()) {
        const [mid, type] = this.unzip(k)
        if (type === msg.type) {
          if (mid < msg.id) {
            // remove
            this.messageQueue.delete(k)
          }
        }
      }
      const id = this.indentify(msg.id, msg.type)
      if (this.messageQueue.has(id)) {
        let msgs = this.messageQueue.get(id)
        if (!msgs) return
        if (Array.isArray(msgs.msg)) {
          msgs.msg.push.apply(msgs.msg, msg.msg)
        } else {
          msgs.msg.push(msg.msg)
          msgs.state = MessageState.FINISH
        }
        this.messageQueue.set(id, msgs);
      } else {
        this.messageQueue.set(id, msg);
      }
      timer.start(() => {
        if (this.messageQueue.size === 0) {
          timer.stop();
          return;
        }
        for (const id of this.messageQueue.keys()) {
          let message = this.messageQueue.get(id)
          if (!message) continue
          const [_, type] = this.unzip(id)
          if (message.msg !== undefined && message.msg.length === 1) {
            console.info('send struct', message.msg, 'to renderer')
            ipcRenderer.send('message-from-worker', { type: type, data: message })
          } else {
            console.info('send ', message, 'to renderer')
            ipcRenderer.send('message-from-worker', { type: type, data: message })
          }
        }
        this.messageQueue.clear()
      }, 200);
    }
    error(msg: string|null) {
      ipcRenderer.send('message-from-worker', { type: ReplyType.INFOM_ERROR_MESSAGE, data: msg })
    }
    regist(msgType: string, msgFunc: IMessageCallback, pointer: any) {
      this.processor.set(msgType, [msgFunc, pointer]);
    }
    private indentify(id: number, type: string): string {
      return type + ',' + id;
    }
    private unzip(key: string): [number, string] {
      const [type, id] = key.split(',')
      return [parseInt(id), type]
    }
  }