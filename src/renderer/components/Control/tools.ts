/**
 * Created by ayou on 18/2/6.
 */

let handlerCache: any;

export const addHandler = function(element: any, type: string, handler: any) {
  handlerCache = handler
  if (element.addEventListener) {
    element.addEventListener(type, handler, false)
  } else if (element.attachEvent) {
    element.attachEvent('on' + type, handler)
  } else {
    element['on' + type] = handler
  }
}

export const removeHandler = function(element: any, type: string) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handlerCache, false)
  } else if (element.detachEvent) {
    element.detachEvent('on' + type, handlerCache)
  } else {
    element['on' + type] = null
  }
}

// depth first search
export const traverseTree = (root: any) => {
  const newRoot = {}

  for (const k in root) {
    if (k !== 'children' && k !== 'parent') {
      newRoot[k] = root[k]
    }
  }

  if (root.children && root.children.length > 0) {
    newRoot['children'] = []
    for (let i = 0, len = root.children.length; i < len; i++) {
      newRoot['children'].push(traverseTree(root.children[i]))
    }
  }
  return newRoot
}
