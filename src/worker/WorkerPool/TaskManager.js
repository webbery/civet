import workerpool from 'workerpool'

const init = (function() {
  let _pool = null
  function _init() {
    if (!_pool) {
      const cpus = require('os').cpus().length
      pool = workerpool.pool({minWokers: cpus > 4 ? 4 : cpus, workerType: 'process'})
    }
  }
  
  let _queue = []
  return function() {
    if (!_pool) {
      _init()
    }
    return {
      addTask: (task, params) => {
        _queue.push([task, params])
      },
      exec: async () => {
        if( _queue.length > 0) {
          const job = _queue.pop()
          return _pool.exec(job[0], job[1])
        }
      },
      release: () => {
        _pool.terminate(true)
      }
    }
  }
})()
export default {
  addTask: async (task, params) => {
    const pool = init()
    pool.addTask(task, params)
    return pool.exec()
  },
  release: () => {
    const pool = init()
    pool.terminate()
  }
}