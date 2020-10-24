import log from 'electron-log'
// import util from 'util'

log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'
let logLevel = ['verb', 'debug', 'info', 'warn', 'error']
let JLog = {}
for (let level of logLevel) {
  JLog[level] = function() {
    let err = new Error()
    let lines = err.stack.split('\n')
    // console.info('LOGGER', lines)
    let result = null
    // for (let index = 2; index < 5; ++index) {
    result = lines[2].match(/at [\w\W]+ \([\w\W]+:([\w\W]+):[0-9]+:([0-9]+)/)
    let files = result[1].split('/')
    let filename = files[files.length - 1]
    let qIndx = filename.lastIndexOf('?')
    if (qIndx > 0) filename = filename.substr(0, qIndx)
    let args = [filename + ':']
    args.push.apply(args, arguments)
    log[level].apply(this, args)
  }
}

export default JLog
