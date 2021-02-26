import { Message, MessageState } from '../public/civet'
const { ipcRenderer } = require('electron')
const timer = (function () {
    let t = null
    return {
      start: (func, tick) => {
        const task = () => {
          // 执行一次func, 然后定时执行func
          func()
          if (t === null) {
            t = setInterval(func, tick)
            console.info('start timer')
          }
        }
        if (t === null) setImmediate(task)
      },
      stop: () => {
        if (t !== null) {
          clearTimeout(t)
          t = null
          console.info('stop timer')
        }
      }
    }
  })()

  export class MessageTransfer {
    threshod: number = 200;
    messageQueue: Map<number, Message>;
    constructor(threshod) {
      this.threshod = threshod
    }
    post(msg: Message) {
      if (this.messageQueue.has(msg.id)) {
        let msgs = this.messageQueue.get(msg.id)
        if (Array.isArray(msgs.msg)) {
          msgs.msg.push.apply(msgs.msg, msg.msg)
        } else {
          msgs.msg.push(msg.msg)
          msgs.state = MessageState.FINISH
        }
        this.messageQueue.set(msg.id, msgs);
      } else {
        this.messageQueue.set(msg.id, msg);
      }
      timer.start(() => {
      }, 200);
      // ipcRenderer.send('message-from-worker', msgs)
    }
  }