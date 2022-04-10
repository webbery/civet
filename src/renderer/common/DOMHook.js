import SandBoxManager from './JSSandBox'
import {isHijackingTag} from './StyleSandBox'

function boostDocumentCreateElement() {
  const rawDocumentCreateElement = document.createElement
  document.createElement = (function (createElement) {
    return function (tagName, options) {
      const element = createElement(tagName, options)
      if (isHijackingTag(tagName)) {
        const sandbox = SandBoxManager.getCurrentSandBox()
      }
      return element
    }
  })(rawDocumentCreateElement)
}