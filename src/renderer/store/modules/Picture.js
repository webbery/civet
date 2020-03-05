const state = {
  imageList: []
}

const getters = {
  imageList: state => state.imageList
}

const mutations = {
  updateImageList(state, imageList) {
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
