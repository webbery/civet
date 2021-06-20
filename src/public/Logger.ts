const log4js = require('log4js')
const log4js_extend = require("log4js-extend")
log4js_extend(log4js, {
  path: __dirname,
  format: "at @name (@file:@line:@column)"
});

log4js.configure({
  appenders: {
    console: { type: 'console' },
    worker: {type: 'fileSync', filename: 'logs/worker.log', maxLogSize: 16 * 1024 * 1024},
    renderer: {type: 'file', filename: 'logs/renderer.log', maxLogSize: 16 * 1024 * 1024},
    main: {type: 'file', filename: 'logs/main.log', maxLogSize: 16 * 1024 * 1024}
  },
  categories: {default: {appenders: ['console', 'worker'], level: 'debug'}}
})

// log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'
// const logLevel = ['verb', 'debug', 'info', 'warn', 'error']
// const JLog = {}
// for (const level of logLevel) {
//   JLog[level] = function() {
//     const err = new Error()
//     const lines = err.stack.split('\n')
//     // console.info('LOGGER', lines)
//     let result = null
//     // for (let index = 2; index < 5; ++index) {
//     result = lines[2].match(/at [\w\W]+ \([\w\W]+:([\w\W]+):[0-9]+:([0-9]+)/)
//     const files = result[1].split('/')
//     let filename = files[files.length - 1]
//     const qIndx = filename.lastIndexOf('?')
//     if (qIndx > 0) filename = filename.substr(0, qIndx)
//     const args = [filename + ':']
//     args.push.apply(args, arguments)
//     // log[level].apply(this, args)
//   }
// }
// const logger = null
const env = process.argv[process.argv.length - 1]
let log = log4js.getLogger('main')
switch(env) {
  case 'worker':
    log = log4js.getLogger('worker')
    log.level = 'debug'
    break
  case 'renderer':
    log = log4js.getLogger('renderer')
    break
  default:
    break
}

export const logger = log