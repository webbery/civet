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

  export class Message {
    id: number = 0;
    tick: number = 0;   // waitting time, unit second
    msg: any;
  }

  export class MessageTransfer {
    threshodMode: number = 200;
    messageQueue: Message[];
    constructor(threshodMode) {
      this.threshodMode = threshodMode
    }
    post(msgs: Message[]) {
      ipcRenderer.send('message-from-worker', msgs)
    }
  }