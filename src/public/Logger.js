// import log from 'electron-log'
// import util from 'util'

// log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'
const logLevel = ['verb', 'debug', 'info', 'warn', 'error']
const JLog = {}
for (const level of logLevel) {
  JLog[level] = function() {
    const err = new Error()
    const lines = err.stack.split('\n')
    // console.info('LOGGER', lines)
    let result = null
    // for (let index = 2; index < 5; ++index) {
    result = lines[2].match(/at [\w\W]+ \([\w\W]+:([\w\W]+):[0-9]+:([0-9]+)/)
    const files = result[1].split('/')
    let filename = files[files.length - 1]
    const qIndx = filename.lastIndexOf('?')
    if (qIndx > 0) filename = filename.substr(0, qIndx)
    const args = [filename + ':']
    args.push.apply(args, arguments)
    // log[level].apply(this, args)
  }
}

export default JLog
