module.exports = function({types: t}) {
  return {
    name: 'log-replacer-plugin',
    visitor: {
      CallExpression(path, state) {
        const obj = path.node.callee.object
        const prop = path.node.callee.property
        const arguments = path.node.arguments

        if (t.isIdentifier(obj) && t.isIdentifier(prop) && obj.name === 'console') {
          const start = state.file.opts.filename.lastIndexOf('\\')
          const filename = state.file.opts.filename.substring(start + 1, state.file.opts.filename.length)
          const location = `[${filename}:${path.node.loc.start.line}]:`
          const prefix = t.stringLiteral(location)
          if (arguments[0].value === prefix.value) return
          arguments.unshift(prefix)
          // arguments.unshift(t.stringLiteral(`${new Date().toLocaleString()}`))
        }
      }
    }
  }
}