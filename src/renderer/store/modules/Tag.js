const state = {
  tags: []
}

const getters = {
  tags: state => {
    console.info('----getter----', state.tags)
    return state.tags
  }
}

const actions = {
  addTag(state, data) {
    const n = {label: data.label, id: data.id, type: 'img'}
    state.tags.push(n)
  },
  setTags(state, tags) {
    console.info('++++++')
    state.tags = tags
  },
  removeTags(state, tags) {}
}

const mutations = {
  addTag({ commit }, data) {
    commit('addTag', data)
  },
  setTags({commit}, tags) {
    commit('setTags', tags)
  },
  removeTags({commit}, tags) {
    commit('removeTags', tags)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
