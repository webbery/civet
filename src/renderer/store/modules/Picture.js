const state = {
  imageList: []
}

const getters = {
  imageList: state => state.imageList
}

const mutations = {
  updateImageList(state, imageList) {
    // {label: item.filename, realpath: item.path + item.filename}
    state.imageList = imageList
  }
}

const actions = {
  updateImageList ({ commit }, imageList) {
    // do something async
    commit('updateImageList', imageList)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
