// 留待版本升级稳定后使用
import Messages from './MessageDefine'
// const { AsyncResource } = require('async_hooks')
const { Worker } = require('worker_threads')

class WorkerPool {
  constructor(numThreads) {
    this.workers = Array.from(Array(numThreads).keys()).map(
      () => {
        const worker = new Worker('./Task.js')
        // worker.on('disconnect', () => { exit(1) })
        worker.on('message', (message) => {
          console.info('task message', message)
          if (message.type === Messages.MSG_TASK_FINISH) {
            console.info('worker +1: ', message.value)
            if (this.tasks.length !== 0) {
              const next = this.tasks.shift()
              this.workers[message.value].postMessage(next)
            } else {
              this.idles[message.value] = 0
            }
          }
        })
        worker.on('exit', () => {
          console.info('exit')
        })
        worker.on('error', () => {})
        return worker
      }
    )
    this.tasks = []
    this.numThreads = numThreads
    this.idleNum = numThreads
    this.idles = Array.from(Array(numThreads).keys()).map(0)
  }

  addTask(func, params) {
    console.info('add task')
    if (this.idleNum <= 0) {
      this.tasks.push({type: Messages.MSG_TASK, script: '(' + func + ')', params: params})
    } else {
      for (let idx = 0; idx < this.numThreads; ++idx) {
        if (this.idles[idx] === 0) {
          this.workers[idx].postMessage({type: Messages.MSG_TASK, value: idx, script: '(' + func + ')', params: params})
          this.idles[idx] = 1
          break
        }
      }
      this.idleNum -= 1
    }
  }

  release() {
    for (let worker of this.workers) {
      worker.postMessage({type: Messages.MSG_EXIT})
    }
  }
}

// class WorkerQueue extends AsyncResource {
//   constructor(cb) {}
// }

const pool = new WorkerPool(4)
export default {
  addTask: (func, params, cb) => {
    pool.addTask(func, params)
  },
  release: () => {}
}
