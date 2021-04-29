import { Cache } from './CacheInstance'

export function removeClass(state, classname) {
  // remove from className
  state.classesName.splice(state.classesName.indexOf(classname), 1)
  // remove from classes
  for (let idx = state.classes.length - 1; idx >= 0; --idx) {
    if (state.classes[idx].name === classname) {
      state.classes.splice(idx, 1)
      break
    }
  }
  // remove from relavent files
  for (const fileid in Cache.files) {
    const file = Cache.files[fileid]
    // console.info(file)
    const pos = file.category.indexOf(classname)
    if (pos >= 0) file.category.splice(pos, 1)
  }
}

export function addClass(state, classname) {}
