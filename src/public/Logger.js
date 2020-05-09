let log = require('electron-log')
const path = require('path')
const util = require('util')
// const log4jsExtend = require('log4js-extend')

// log4jsExtend(log4js, {
//   path: __dirname,
//   format: 'at @name (@file:@line:@column)'
// })

// const logger = log4js.getLogger('')

function extend(logger) {
  // var logger = log4js.getLogger();
  ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function (method) {
    var original = logger.constructor.prototype[method]
    logger.constructor.prototype[method] = function log() {
      let args = [].slice.call(arguments)
      let trace = getTrace(log)
      args.push(formatter(trace))
      return original.apply(this, args)
    }
  })
}

function prepareStackTrace(error, structuredStackTrace) {
  if (error) return 'error'
  var trace = structuredStackTrace[0]
  return {
    // method name
    name: trace.getMethodName() || trace.getFunctionName() || '<anonymous>',
    // file name
    file: trace.getFileName(),
    // line number
    line: trace.getLineNumber(),
    // column number
    column: trace.getColumnNumber()
  }
}

function getTrace(caller) {
  let original = Error.prepareStackTrace
  let error = {}
  Error.prepareStackTrace = prepareStackTrace
  Error.captureStackTrace(error, caller || getTrace)
  var stack = error.stack
  Error.prepareStackTrace = original
  return stack
}

// format trace
function formatter(trace) {
  if (trace.file) {
    // absolute path -> relative path
    exports.path && (trace.file = path.relative(exports.path, trace.file))
  } else {
    trace.file = ''
  }

  return ''
    .split('@name').join(trace.name)
    .split('@file').join(trace.file)
    .split('@line').join(trace.line)
    .split('@column').join(trace.column)
}

var extended = false
function extendLogger(log, options) {
  extended || extend(log)
  extended = true

  // init
  exports.path = null
  exports.format = 'at @name (@file:@line:@column)'

  options || (options = {})
  options.path && (exports.path = options.path)
  options.format && (exports.format = options.format)

  return log
}
log = extendLogger(log, {
  path: __dirname,
  format: 'at @name (@file:@line:@column)'
})

export default {
  info: (text) => {
    console.info(log)
    log.info(JSON.stringify(text))
  }
}
