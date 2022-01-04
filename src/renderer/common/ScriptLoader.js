// import vm from 'vm'
import crypto from 'crypto'

export default (function() {
  let groupQueue
  let groupCursor = 0
  let scripts = {}

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
    // console.info('scripts:', hash, scripts[hash])
    if (scripts[hash] !== undefined) return null
    return new Promise((resolve, reject) => {
      const SCRIPT_TAG_REGEX = /<(script)\b[^>]*>([\s\S]*?)<\/\1>/is
      const matchs = script.match(SCRIPT_TAG_REGEX)
      let s = document.createElement('script')
      scripts[hash] = s
      s.type = 'text/javascript'
      // if some script bug is encounter, this link may be help:
      // https://stackoverflow.com/questions/50955566/remove-script-tag-from-html-and-from-the-dom-with-js
      if (matchs) {
        console.info('content script')
        try {
          s.innerHTML = matchs[2] || 'Empty Script'
          document.body.appendChild(s)
          resolve(true)
        } catch (err) {
          // events.emit('civet', 'onErrorMessage', {msg: err})
          resolve(false)
        }
      } else {
        s.onload = function() {
          console.info('complete')
          resolve(true)
        }
        s.onerror = function(oError) {
          console.error('The script ' + oError.target.src + ' is not accessible.')
          reject(oError)
        }
        console.info('src script')
        s.async = true
        s.src = script
        document.head.appendChild(s)
      }
    })
  }

  let loadGroup = async function() {
    for (;groupCursor < groupQueue.length; ++groupCursor) {
      console.info('load group', groupCursor)
      await loadScript(groupQueue[groupCursor])
    }
  }

  let loadMultiGroup = function(scripts) {
    if (scripts.length === 0) return null
    groupCursor = 0
    groupQueue = scripts
    clearScript()
    return loadGroup()
  }

  return {
    load: loadMultiGroup
  }
})()
