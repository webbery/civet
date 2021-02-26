const { ipcRenderer } = require('electron')

const threshodMode = true
let queue = {}

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
export function reply2Renderer(type, value) {
  if (threshodMode === true) {
    // 首先存到队列中，如果定时器关闭，启动定时器
    if (!queue[type]) {
      queue[type] = []
    }
    if (Array.isArray(value)) {
      queue[type].push.apply(queue[type], value)
    } else {
      queue[type].push(value)
    }
    console.info('queue value:', queue)
    timer.start(() => {
      console.info('queue task', queue.length, Object.keys(queue))
      if (Object.keys(queue).length === 0) {
        timer.stop()
        return
      }
      console.info(queue.length)
      for (const tp in queue) {
        if (queue[tp].length === 1) {
          ipcRenderer.send('message-from-worker', { type: tp, data: queue[tp] })
        } else {
          console.info('send ', queue[tp].length, 'to renderer')
          ipcRenderer.send('message-from-worker', { type: tp, data: queue[tp] })
        }
      }
      console.info('clear queue')
      queue = {}
    }, 200)
  } else {
    ipcRenderer.send('message-from-worker', { type: type, data: value })
  }
}
