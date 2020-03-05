const state = {
  picture: null
}

const mutations = {
  updateSelection(state, selected) {
    state.picture = selected
  }
}

const actions = {
  updateSelection({ commit }, selected) {
    // do something async
    commit('updateSelection', selected)
  }
}

export default {
  state,
  mutations,
  actions
}
