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

function isImageExist(imageID, imgs) {
  for (let img of imgs) {
    if (imageID == img.id) return true
  }
  return false
}

const mutations = {
  updateImageList(state, imageList) {
    // {label: item.filename, realpath: item.path + item.filename}
    state.imageList = imageList
  },
  addImage(state, image) {
    if (state.imageList.length === 0) {
      state.imageList.push(image)
      return
    }
    if (!isImageExist(image.id, state.imageList)) {
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
        // console.info('update ', obj)
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
