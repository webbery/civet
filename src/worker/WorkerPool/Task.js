import Messages from './MessageDefine'
const { parentPort } = require('worker_threads')

parentPort.on('message', (message) => {
  console.info('worker message :', message)
  switch (message.type) {
    case Messages.MSG_EXIT:
      parentPort.close()
      break
    case Messages.MSG_TASK:
      const params = message.params.join()
      const result = eval(message.script + '(' + params + ')')
      parentPort.postMessage({type: Messages.MSG_TASK_FINISH, value: message.value})
      break
    default:
      break
  }
  if (message === 'exit') {

  }
})

parentPort.on('close', () => {
  console.info('close')
})
