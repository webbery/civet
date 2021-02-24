import workerpool from 'workerpool'

const init = (function() {
  let _pool = null
  function _init() {
    if (!_pool) {
      const cpus = require('os').cpus().length
      _pool = workerpool.pool({ minWokers: cpus > 4 ? 4 : cpus, workerType: 'process' })
    }
  }

  return function() {
    if (!_pool) {
      _init()
    }
    return {
      exec: async (task, params) => {
        return _pool.exec(task, params)
      },
      release: () => {
        _pool.terminate(true)
      }
    }
  }
})()
export default {
  exec: async (task, params) => {
    const pool = init()
    return pool.exec(task, params)
  },
  release: () => {
    const pool = init()
    pool.terminate()
  }
}
