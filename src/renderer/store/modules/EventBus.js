const state = {
  importDirectory: null
}

const getters = {
  imageList: state => state.imageList
}

const mutations = {
  updateImageList(state, importDirectory) {
    state.importDirectory = importDirectory
  }
}

const actions = {
  updateImportDirectory({ commit }, importDirectory) {
    // do something async
    commit('updateImportDirectory', importDirectory)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
