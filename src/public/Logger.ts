const log4js = require('log4js')

log4js.configure({
  appenders: {
    console: { type: 'console' },
    worker: {type: 'file', filename: 'logs/civet.log', maxLogSize: 16 * 1024 * 1024},
    renderer: {type: 'file', filename: 'logs/civet.log', maxLogSize: 16 * 1024 * 1024},
    main: {type: 'file', filename: 'logs/civet.log', maxLogSize: 16 * 1024 * 1024}
  },
  categories: {default: {appenders: ['console', 'main'], level: 'debug'}}
})

// const logger = null
const env = process.argv[process.argv.length - 1]
let log = log4js.getLogger('main')
switch(env) {
  case 'worker':
    log = log4js.getLogger('worker')
    break
  case 'renderer':
    log = log4js.getLogger('renderer')
    break
  default:
    break
}
console = log

export const logger = log