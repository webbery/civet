// import vm from 'vm'
import crypto from 'crypto'

export default (function() {
  let groupQueue
  let groupCursor = 0
  let currentGroupFinished = 0
  let scripts = {}

  let loadFinished = function() {
    currentGroupFinished++
    console.info('script load finish', currentGroupFinished, groupQueue.length)
    if (currentGroupFinished < groupQueue.length) {
      nextGroup()
      loadGroup()
    }
  }

  let nextGroup = function() {
    // currentGroupFinished = 0
    groupCursor++
  }

  let loadError = function(oError) {
    console.error('The script ' + oError.target.src + ' is not accessible.')
  }

  let removeScript = function (hash) {
    const node = scripts[hash]
    if (node === undefined) return
    if (document.body.contains(node)) {
      document.body.removeChild(node)
    }
    if (document.head.contains(node)) {
      document.head.removeChild(node)
    }
    scripts[hash] = undefined
  }

  let clearScript = function() {
    for (let hash in scripts) {
      removeScript(hash)
    }
  }
  let loadScript = function(script) {
    const md5 = crypto.createHash('md5')
    const hash = md5.update(script).digest('base64')
    console.info('scripts:', hash, scripts[hash])
    if (scripts[hash] !== undefined) return
    const SCRIPT_TAG_REGEX = /<(script)\b[^>]*>([\s\S]*?)<\/\1>/is
    const matchs = script.match(SCRIPT_TAG_REGEX)
    let s = document.createElement('script')
    s.type = 'text/javascript'
    s.onerror = loadError
    if (s.readyState) {
      s.onreadystatechange = function() {
        if (s.readyState === 'loaded' || s.readyState === 'complete') {
          s.onreadystatechange = null
          loadFinished()
        }
      }
    } else {
      s.onload = function() {
        loadFinished()
      }
    }
    // if some script bug is encounter, this link may be help:
    // https://stackoverflow.com/questions/50955566/remove-script-tag-from-html-and-from-the-dom-with-js
    if (matchs) {
      s.innerHTML = matchs[2]
      document.body.appendChild(s)
    } else {
      s.src = script
      document.head.appendChild(s)
    }
    scripts[hash] = s
  }

  let loadGroup = function() {
    // if (groupCursor >= 1) return
    loadScript(groupQueue[groupCursor])
  }

  let loadMultiGroup = function(scripts) {
    if (scripts.length === 0) return
    groupCursor = 0
    currentGroupFinished = 0
    groupQueue = scripts
    clearScript()
    loadGroup()
  }

  return {
    load: loadMultiGroup
  }
})()
