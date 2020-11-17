const state = {
    query: {},
    cache: [],
    classes: [],
    viewItems: []
  }
  
  const getters = {
    tags: state => {
      console.info('----getter----', state.tags)
      return state.query
    }
  }
  
  const actions = {
    addCondition(state, data) {
    //   const n = {label: data.label, id: data.id, type: 'img'}
    //   state.query.push(n)
    },
    setCondition(state, query) {
    //   console.info('++++++')
      state.query = query
    },
    removeCondition(state, query) {}
  }
  
  const mutations = {
    addCondition({ commit }, query) {
      commit('addCondition', data)
    },
    setCondition({commit}, query) {
      commit('setCondition', taquerygs)
    },
    removeCondition({commit}, query) {
      commit('removeCondition', query)
    }
  }
  
  export default {
    state,
    getters,
    mutations,
    actions
  }
  