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
    for (let img of state.imageList) {
      if (img.id === image.id) continue
      newFlag = true
    }
    if (newFlag === true) {
      state.imageList.push(image)
    }
  }
}

const actions = {
  updateImageList ({ commit }, imageList) {
    // do something async
    commit('updateImageList', imageList)
  },
  addImage ({ commit }, image) {
    commit('addImage', image)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
