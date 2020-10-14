console.info('This is task!')
const { parentPort } = require('worker_threads')

parentPort.on('message', (message) => {
  console.info('worker message :', message)
  if (message === 'exit') {
    parentPort.close()
  }
  parentPort.postMessage('finish')
})

parentPort.on('close', () => {
  console.info('close')
})
