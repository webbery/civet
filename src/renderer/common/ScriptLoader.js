import vm from 'vm'

export default (function() {
  let groupQueue
  let groupCursor = 0
  let currentGroupFinished = 0

  let loadFinished = function() {
    currentGroupFinished++
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

  let loadScript = function(script) {
    const SCRIPT_TAG_REGEX = /<(script)\s+((?!type=('|")text\/ng-template\3).)*?>(.*?)<\/\1>/is
    const matchs = script.match(SCRIPT_TAG_REGEX)
    if (matchs) {
      vm.runInThisContext(matchs[4])
      loadFinished()
    } else {
      let s = document.createElement('script')
      s.type = 'text/javascript'
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
      s.onerror = loadError
      s.src = script
      document.body.appendChild(s)
    }
  }

  let loadGroup = function() {
    // if (groupCursor >= 1) return
    loadScript(groupQueue[groupCursor])
  }

  let loadMultiGroup = function(scripts) {
    groupCursor = 0
    groupQueue = scripts
    loadGroup()
  }

  return {
    load: loadMultiGroup
  }
})()
