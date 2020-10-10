const async_hooks = require('async_hooks')
const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads')

let workers = []

export default {
  init: (numThreads) => {
    workers = Array.from(Array(numThreads).keys()).map(
      () =>
        new Worker(ThreadWorker.code, {
          ...workerOptions,
          eval: true
        })
    );
  }
}
