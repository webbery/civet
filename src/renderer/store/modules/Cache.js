import FileBase from '@/../public/FileBase'
import Kernel from '@/../public/Kernel'
import Service from '@/components/utils/Service'
import Vue from 'vue'

const state = {
  query: {},
  cache: {},
  classes: [],
  // classes: [{name: 'test', id: 2, count: 15, children: [{name: 'child', id: 3, count: 1, children: [{name: 'aaa', id: 5, count: 1, children: [{name: 'bbb', id: 7, count: 0}]}]}]}, {name: '测试', id: 4, count: 10}],
  classesName: [],
  viewItems: [],
  tags: {},
  allCount: 0,
  untags: 0,
  unclasses: 0,
  // router histories count
  histories: 0
}

const getters = {
  viewItems: state => {
    return state.viewItems
  },
  classes: state => { return state.classes },
  getFiles: (state, getters) => {
    return (filesID) => {
      console.info('get files: ', filesID)
      let files = []
      for (let fileID of filesID) {
        const file = state.cache[fileID]
        if (file !== null) {
          files.push(file)
        }
      }
      return files
    }
  },
  classesName: state => { return state.classesName },
  untags: state => { return state.untags },
  unclasses: state => { return state.unclasses },
  tags: state => { return state.tags },
  allCount: state => { return state.allCount },
  histories: state => { return state.histories }
}

const remote = {
  async recieveCounts() {
    const uncalsses = await Service.getServiceInstance().get(Service.GET_UNCATEGORY_IMAGES)
    const untags = await Service.getServiceInstance().get(Service.GET_UNTAG_IMAGES)
    console.info('untag is', untags, 'unclasses:', uncalsses)
    return {unclasses: uncalsses, untags: untags}
  },
  async recieveTags() {
    return Service.getServiceInstance().get(Service.GET_ALL_TAGS)
  }
}

const maxCacheSize = 40 + 20 + 10

const mutations = {
  init(state, data) {
    console.info('cache init')
    let snaps = Kernel.getFilesSnap()
    let imagesID = []
    for (let snap of snaps) {
      imagesID.push(snap.id)
      // if (imagesID.length > 40) break
    }
    const images = Kernel.getFilesInfo(imagesID)
    for (let image of images) {
      state.cache[image.id] = new FileBase(image)
      if (state.cache.length > maxCacheSize) break
    }
    // const len = state.cache.length
    // setting view panel item
    mutations.display(state, data)
    // get classes
    const cls = data['allClasses']
    if (cls) {
      for (let idx = 0; idx < cls.length; ++idx) {
        let clazz = cls[idx]
        if (clazz['children'] && clazz['children'].length > 0 && typeof clazz['children'][0] === 'object') {
          clazz.hasChild = true
        }
        Vue.set(state.classes, idx, clazz)
      }
    }
    // init classes name
    let candidates = [].concat(state.classes)
    for (let idx = 0; idx < candidates.length;) {
      let front = candidates.shift()
      if (front.children) {
        const children = []
        for (let element of front.children) {
          if (typeof element !== 'object') continue
          children.push({name: front.name + '/' + element.name, id: element.id, children: element.children})
        }
        candidates = candidates.concat(children)
      }
      let className = front.name
      if (className[0] !== '/') className = '/' + className
      console.info('className in property:', className)
      state.classesName.push(className)
    }
    // count
    state.unclasses = data['unclasses'].length
    state.untags = data['untags'].length
    state.allCount = snaps.length
    // tags
    const tags = Kernel.getAllTags()
    console.info('tags', tags)
    state.tags = tags
  },
  addFiles(state, files) {
    let idx = 0
    console.info('addFiles:', files)
    for (let file of files) {
      if (state.cache.hasOwnProperty(file.id)) continue
      state.cache[file.id] = new FileBase(file)
      // setting view panel item
      if (state.cache.length > maxCacheSize) break
      const pos = state.viewItems.length + idx
      Vue.set(state.viewItems, pos, state.cache[file.id])
    }
  },
  display(state, data) {
    let idx = 0
    for (let k in state.cache) {
      Vue.set(state.viewItems, idx, state.cache[k])
      idx += 1
      if (idx > maxCacheSize) break
    }
  },
  async query(state, result) {
    //   console.info('++++++')QUERY_FILES
    state.query = result
    state.viewItems.splice(0, state.viewItems.length)
    for (let idx = 0; idx < state.query.length; ++idx) {
      Vue.set(state.viewItems, idx, state.cache[result[idx].id])
    }
    console.info(state.viewItems, result)
  },
  async addTag(state, mutation) {
    const {fileID, tag} = mutation
    console.info('cache add tag:', fileID, tag)
    const file = state.cache[fileID]
    if (!file) {
      Kernel.writeLog('cache add tag 0, fileID=' + fileID)
      return
    }
    file.tag.push(tag)
    Service.getServiceInstance().send(Service.SET_TAG, {id: [fileID], tag: file.tag})
    // const {unclasses, untags} = await remote.recieveCounts()
    if (file.tag.length === 1) {
      state.untags += 1
    }
    // update tags
    // state.tags = await remote.recieveTags()
  },
  addClass(state, mutation) {
    let classpath = null
    let files = []
    if (Array.isArray(mutation)) {
      classpath = mutation
    } else if (typeof mutation === 'object') {
      classpath = mutation.class
      files = mutation.id
    } else {
      return
    }
    // update navigation panel data
    const findClass = function (clsPath, classes, parent) {
      for (let item of classes) {
        if (item.type === 'clz') {
          const name = parent + '/' + item.name
          console.info('compare class:', name, clsPath)
          if (name === clsPath) return item
          if (item.children && item.children.length !== 0) {
            const result = findClass(clsPath, item.children, name)
            if (result) return result
          }
        }
      }
      return null
    }
    const addChildClass = function (item, parent) {
      console.info(item.name, 'parent:', parent)
      if (!parent.children) parent.children = []
      Vue.set(parent.children, parent.children.length, item)
      parent.hasChild = true
    }
    const getParentAndName = function (classpath) {
      if (classpath[0] !== '/') classpath = '/' + classpath
      let idx = classpath.lastIndexOf('/')
      let parent = classpath
      let name = classpath
      if (idx > 0) {
        parent = classpath.substr(0, idx)
        name = classpath.substr(idx + 1, classpath.length - idx - 1)
      }
      console.info('parent', parent, 'name', name)
      return {parent: parent, name: name}
    }
    console.info('----------2---------', classpath, mutation, state.classes)
    for (let clsPath of classpath) {
      const {parent, name} = getParentAndName(clsPath)
      console.info('path:', clsPath, 'parent:', parent)
      let clazz = findClass(parent, state.classes, '')
      console.info('class:', clazz)
      if (!clazz) clazz = state.classes
      if (!clazz.count) clazz.count = 1
      else clazz.count += 1
      addChildClass({name: name, type: 'clz', children: files}, clazz)
    }

    let classes = []
    for (let clsPath of classpath) {
      if (clsPath[0] === '/') classes.push(clsPath.substr(1))
      else classes.push(clsPath)
    }
    let mutationWithoutRoot = {}
    if (Array.isArray(mutation)) {
      mutationWithoutRoot = classes
    } else {
      mutationWithoutRoot['id'] = files
      mutationWithoutRoot['class'] = classes
    }
    console.info('send add category', mutationWithoutRoot)
    // Service.getServiceInstance().send(Service.ADD_CATEGORY, mutationWithoutRoot)
    console.info('classes', state.classes)
  },
  removeClass(state, mutation) {
    console.info('remove class', mutation)
    if (Array.isArray(mutation)) {
      for (let clsName of mutation) {
        // remove from className
        state.classesName.splice(state.classesName.indexOf(clsName), 1)
        // remove from classes
        for (let idx = state.classes.length - 1; idx >= 0; --idx) {
          if (state.classes[idx].name === clsName) {
            state.classes.splice(idx, 1)
            break
          }
        }
        // remove from relavent files
        for (let fileid in state.cache) {
          let file = state.cache[fileid]
          // console.info(file)
          let pos = file.category.indexOf(clsName)
          if (pos >= 0) file.category.splice(pos, 1)
        }
      }
    } else {
      for (let clsName of mutation) {
        // remove from classes
        for (let idx = state.classes.length - 1; idx >= 0; --idx) {
          if (state.classes[idx].name === clsName) {
            state.classes.count -= 1
            break
          }
        }
      }
    }
    Service.getServiceInstance().send(Service.REMOVE_CLASSES, mutation)
  },
  removeFiles(state, query) {},
  removeTags(state, mutation) {
    Service.getServiceInstance().send(Service.REMOVE_TAG, {tag: [mutation.tag], filesID: [mutation.id]})
    let file = state.cache[mutation.id]
    file.tag.splice(file.tag.indexOf(mutation.tag), 1)
  },
  update(state, sql) {},
  updateHistoryLength(state, value) {
    state.histories = value
  },
  updateCount(state, counts) {
    // count
    state.unclasses = counts.unclasses.length
    state.untags = counts.untags.length
  }
}

const actions = {
  async init({ commit }, flag) {
    const {unclasses, untags} = await remote.recieveCounts()
    const allClasses = await Service.getServiceInstance().get(Service.GET_ALL_CATEGORY, '/')
    console.info('all classes:', allClasses)
    commit('init', {unclasses, untags, allClasses})
  },
  async query({commit}, query) {
    const result = await Service.getServiceInstance().get(Service.QUERY_FILES, query)
    console.info('query: ', query, 'result: ', result)
    commit('query', result)
  },
  display({commit}, data) {
    commit('display', data)
  },
  removeFiles({commit}, files) {
    commit('removeFiles', files)
  },
  async addFiles({commit}, files) {
    commit('addFiles', files)
    // count
    const counts = await remote.recieveCounts()
    commit('updateCounts', counts)
  },
  addTag({commit}, mutation) {
    commit('addTag', mutation)
  },
  addClass({commit}, mutation) {
    commit('addClass', mutation)
  },
  removeClass({commit}, mutation) {
    commit('removeClass', mutation)
  },
  removeTags({commit}, mutation) {
    commit('removeTags', mutation)
  },
  changeFileName({commit}, mutation) {},
  changeClassName({commit}, mutation) {},
  update({commit}, sql) {
    /*
     *  sql like: {query:'', $set:{}}, {query:'', $unset:{}}
     */
    commit('update', sql)
  },
  remove({commit}, sql) {
    /*
     *  sql like: {query:''}
     */
    commit('update', sql)
  },
  insert({commit}, sql) {
    /*
     *  sql like: {query:'', value: {}}
     */
  },
  updateHistoryLength({commit}, value) {
    commit('updateHistoryLength', value)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
