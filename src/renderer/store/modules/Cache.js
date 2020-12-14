import FileBase from '@/../public/FileBase'
import Kernel from '@/../public/Kernel'
import Service from '@/components/utils/Service'
import Vue from 'vue'

const state = {
  query: {},
  cache: [],
  classes: [{name: 'test.jpg', type: 'jpg', id: 1}, {name: 'test', type: 'clz', id: 2, children: [{name: 'test2.jpg', type: 'jpg', id: 3}]}],
  classesName: ['test'],
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
      let files = []
      for (let fileID of filesID) {
        const file = state.cache.filter(file => file.id === fileID)
        if (file !== null) {
          files.push(file[0])
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
    }
    const images = Kernel.getFilesInfo(imagesID)
    for (let image of images) {
      state.cache.push(new FileBase(image))
      // console.info(image)
    }
    const len = state.cache.length
    // setting view panel item
    for (let idx = 0; idx < len; ++idx) {
      Vue.set(state.viewItems, idx, state.cache[idx])
    }
    // get classes
    const cls = Kernel.getClasses('/')
    if (cls) {
      for (let idx = 0; idx < cls.length; ++idx) {
        Vue.set(state.classes, idx, cls[idx])
      }
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
    for (let file of files) {
      state.cache.push(new FileBase(file))
    }
    // setting view panel item
    for (let idx = 0; idx < files.length; ++idx) {
      const pos = state.viewItems.length + idx
      Vue.set(state.viewItems, pos, state.cache[pos])
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
    const files = state.cache.filter(file => file.id === fileID)
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
    const isClassExist = function (clsPath, classes, parent) {
      for (let item of classes) {
        if (item.type === 'clz') {
          const name = parent + '/' + item.name
          if (name === clsPath) return true
          if (item.children && item.children.length !== 0) {
            return isClassExist(clsPath, item.children, name)
          }
        }
      }
      return false
    }
    if (isClassExist(mutation[0], state.classes, '')) return
    state.classes.push({name: mutation[0], type: 'clz', children: []})
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
