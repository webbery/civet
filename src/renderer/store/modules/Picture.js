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
  },
  addImage(state, image) {
    let newFlag = false
    if (state.imageList.length === 0) {
      state.imageList.push(image)
      return
    }
    for (let img of state.imageList) {
      if (img.id === image.id) continue
      newFlag = true
    }
    if (newFlag === true) {
      state.imageList.push(image)
    }
  },
  clearImages(state) {
    state.imageList = []
  }
}

const actions = {
  updateImageList ({ commit }, imageList) {
    // do something async
    commit('updateImageList', imageList)
  },
  addImage ({ commit }, image) {
    commit('addImage', image)
  },
  clearImages ({ commit }) {
    commit('clearImages')
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
