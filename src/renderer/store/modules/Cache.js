import FileBase from '@/../public/FileBase'
import Kernel from '@/../public/Kernel'
import Vue from 'vue'

const state = {
  query: {},
  cache: [],
  classes: [],
  viewItems: [],
  tags: {},
  properties: {}
}

const getters = {
  tags: state => {
    console.info('----getter----', state.tags)
    return state.query
  },
  viewItems: state => {
    return state.viewItems
  },
  classes: state => { return state.classes }
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
    const cls = Kernel.getAllClasses()
    if (cls) {
      for (let idx = 0; idx < cls.length; ++idx) {
        Vue.set(state.classes, idx, cls[idx])
      }
    }
  },
  query(state, query) {
    //   console.info('++++++')
    state.query = query
  },
  removeFiles(state, query) {}
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
    commit('removeFiles', files)
  },
  addTags({commit}, sql) {}
}

export default {
  state,
  getters,
  mutations,
  actions
}
