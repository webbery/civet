// 分类文件夹缓存数据
// [{name: name, type: dir/jpg, children: []}]
const state = {
  category: null
}

const getters = {
  category: state => state.category
}

const mutations = {
  changeCategoryName(state, newName, chain) {
    for (let item of state.category) {
      if (item.chain === chain) {
        item.name = newName
      }
    }
  },
  addCategory(state, newName, chain) {
    let chainNames = chain.split('.')
    let parent = state.category
    for (let item of chainNames) {
      for (let child of parent) {
        if (child.name === item && child.type === 'dir') {
          parent = child.children
          break
        }
      }
    }
    parent.push({name: newName, type: 'dir', children: []})
  },
  setCategory(state, category) {
    state.category = category
  }
}

const actions = {
  changeCategoryName({ commit }, newName, chain) {
    commit('changeCategoryName', newName, chain)
  },
  addCategory({ commit }, newName, chain) {
    commit('addCategory', newName, chain)
  },
  setCategory({ commit }, category) {
    commit('setCategory', category)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
