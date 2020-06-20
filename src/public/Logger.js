import log from 'electron-log'

log.transports.console.format = '{h}:{i}:{s} [{level}] {text}'

let JLog = (function() {
  return {
    debug: () => {
      let err = new Error()
      let lines = err.stack.split('\n')
      let result = lines[2].match(/at [\w\W]+ \([\w\W]+\?!([\w\W]+)\?([\w\W]+&)*:[0-9]+:([0-9]+)/)
      let files = result[1].split('/')
      log.debug(files[files.length - 1], arguments)
    },
    info: () => {
      let err = new Error()
      let lines = err.stack.split('\n')
      // console.info(lines)
      let result = lines[2].match(/at [\w\W]+ \([\w\W]+\?!([\w\W]+)\?([\w\W]+&)*:[0-9]+:([0-9]+)/)
      let files = result[1].split('/')
      log.info(files[files.length - 1], arguments)
    },
    warning: () => {},
    error: () => {}
  }
})()

export default JLog
