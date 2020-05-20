const state = {
  imageList: []
}

const getters = {
  imageList: state => state.imageList,
  image: state => (imageID) => {
    const images = state.imageList
    let sID = imageID
    for (let img of images) {
      if (img.id === sID) return img
    }
    return null
  }
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
  },
  updateImageProperty(state, obj) {
    for (let img of state.imageList) {
      if (img.id === obj.id) {
        img[obj.key] = obj.value
        console.info(state.imageList)
        break
      }
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
  },
  clearImages ({ commit }) {
    commit('clearImages')
  },
  updateImageProperty ({ commit }, obj) {
    commit('updateImageProperty', obj)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
