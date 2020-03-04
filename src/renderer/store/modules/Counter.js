const state = {
  main: 0,
  expandImages: []
}

const mutations = {
  DECREMENT_MAIN_COUNTER (state) {
    state.main--
  },
  INCREMENT_MAIN_COUNTER (state) {
    state.main++
  },
  SET_EXPAND_IMAGES (state, val) {
    state.expandImages = val
  }
}

const actions = {
  someAsyncTask ({ commit }) {
    // do something async
    commit('INCREMENT_MAIN_COUNTER')
    commit('SET_EXPAND_IMAGES')
  }
}

export default {
  state,
  mutations,
  actions
}
