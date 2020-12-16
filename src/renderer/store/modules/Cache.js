import FileBase from '@/../public/FileBase'
import Kernel from '@/../public/Kernel'
import Service from '@/components/utils/Service'
import Vue from 'vue'

const state = {
  query: {},
  cache: {},
  classes: [{name: 'test', id: 2, count: 15, children: [{name: 'child', id: 3, count: 1, children: [{name: 'aaa', id: 5, count: 1, children: [{name: 'bbb', id: 7, count: 0}]}]}]}, {name: '测试', id: 4, count: 10}],
  classesName: [],
  viewItems: [],
  tags: {},
  untags: 0,
  unclasses: 0
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
  tags: state => { return state.tags }
}

const remote = {
  async recieveCounts() {
    const uncalsses = await Service.getServiceInstance().get(Service.GET_UNCATEGORY_IMAGES)
    const untags = await Service.getServiceInstance().get(Service.GET_UNTAG_IMAGES)
    return {uncalsses: uncalsses, untags: untags}
  },
  async recieveTags() {
    return Service.getServiceInstance().get(Service.GET_ALL_TAGS)
  }
}

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
    }
    // const len = state.cache.length
    // setting view panel item
    let idx = 0
    for (let k in state.cache) {
      Vue.set(state.viewItems, idx, state.cache[k])
      idx += 1
    }
    // get classes
    const cls = Kernel.getClasses('/')
    if (cls) {
      for (let idx = 0; idx < cls.length; ++idx) {
        // Vue.set(state.classes, idx, cls[idx])
      }
    }
    // init classes name
    let candidates = [].concat(state.classes)
    for (let idx = 0; idx < candidates.length;) {
      let front = candidates.shift()
      if (front.children) {
        const children = front.children.map(element => {
          return {name: front.name + '/' + element.name, id: element.id, children: element.children}
        })
        candidates = candidates.concat(children)
      }
      state.classesName.push({name: front.name, id: front.id})
    }
    // count
    const untags = Kernel.getUnTagFiles()
    console.info('untags:', untags)
    state.untags = untags.length
    const unclasses = Kernel.getUnClassifyFiles()
    console.info('unclassify:', unclasses)
    state.unclasses = unclasses.length
    // tags
    const tags = Kernel.getAllTags()
    console.info('tags', tags)
    state.tags = tags
  },
  addFiles(state, files) {
    let idx = 0
    for (let file of files) {
      if (state.cache.hasOwnProperty(file.id)) continue
      state.cache[file.id] = new FileBase(file)
      // setting view panel item
      const pos = state.viewItems.length + idx
      Vue.set(state.viewItems, pos, state.cache[file.id])
    }
    // count
    const untags = Kernel.getUnTagFiles()
    state.untags = untags.length
    const unclasses = Kernel.getUnClassifyFiles()
    state.unclasses = unclasses.length
  },
  query(state, query) {
    //   console.info('++++++')QUERY_FILES
    state.query = query
    Service.getServiceInstance().get(Service.QUERY_FILES, state.query)
  },
  async addTag(state, mutation) {
    const {fileID, tag} = mutation
    console.info('cache add tag:', fileID, tag)
    const files = state.cache[fileID]
    if (files.length === 0) {
      Kernel.writeLog('cache add tag 0, fileID=' + fileID)
      return
    }
    files[0].tag.push(tag)
    Service.getServiceInstance().send(Service.SET_TAG, {id: [fileID], tag: files[0].tag})
    const {unclasses, untags} = await remote.recieveCounts()
    state.untags = untags.length
    state.uncalsses = unclasses.length
    // update tags
    state.tags = await remote.recieveTags()
  },
  addClass(state, mutation) {
    console.info('add class', mutation)
    Service.getServiceInstance().send(Service.ADD_CATEGORY, mutation)
    // update navigation panel data
    const findClass = function (clsPath, classes, parent) {
      for (let item of classes) {
        if (item.type === 'clz') {
          const name = parent + '/' + item.name
          if (name === clsPath) return item
          if (item.children && item.children.length !== 0) {
            return findClass(clsPath, item.children, name)
          }
        }
      }
      return null
    }
    const addChildClass = function (item, parent) {
      console.info(item.name)
    }
    const addChildFiles = function (item, parent, state) {
      console.info('add files', item)
      if (!parent.children) {
        Vue.set(parent, 'children', [])
      }
      const start = parent.children.length
      for (let offset = 0; offset < item.length; ++offset) {
        const file = state.cache[item[offset]]
        Vue.set(parent.children, start + offset, {name: file.filename, id: file.id, type: file.type, icon: 'el-icon-picture'})
      }
    }
    let classpath = null
    let files = []
    if (typeof mutation === 'object') {
      classpath = mutation.class
      files = mutation.id
    } else {
      classpath = mutation
    }
    for (let clsPath of classpath) {
      let clazz = findClass(clsPath, state.classes, '')
      if (clazz && files.length > 0) {
        addChildFiles(files, clazz, state)
      } else {
        addChildClass({name: clsPath, type: 'clz', children: files}, state.classes)
      }
    }
  },
  removeFiles(state, query) {},
  update(state, sql) {}
}

const actions = {
  init({ commit }, flag) {
    commit('init', flag)
  },
  query({commit}, query) {
    commit('query', query)
  },
  removeFiles({commit}, files) {
    commit('removeFiles', files)
  },
  addFiles({commit}, files) {
    commit('addFiles', files)
  },
  addTag({commit}, mutation) {
    commit('addTag', mutation)
  },
  addClass({commit}, mutation) {
    commit('addClass', mutation)
  },
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
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
