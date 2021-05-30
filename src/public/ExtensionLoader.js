export function makeRequireFunction(mod) {
  var Module = mod.constructor
  var $require = function require(path) {
    try {
      console.info('require:', path, 'mod:', mod)
      return mod.require(path)
    } finally {
      // nothing
    }
  }
  $require.resolve = function resolve(request, options) {
    console.info('request:', request, 'option:', options)
    return Module._resolveFilename(request, mod, false, options)
  }
  $require.main = process.mainModule
  $require.extensions = Module._extensions
  $require.cache = Module._cache
  return $require
}
