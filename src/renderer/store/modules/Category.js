// import Service from '../../components/utils/Service'
// 分类文件夹缓存数据
// [{label: name, type: dir/jpg, children: []}]
const state = {
  category: []
}

const getters = {
  category: state => {
    // console.info('category', state.category)
    return state.category
  },
  classesName: state => {
    let names = []
    let children = state.category.slice(0)
    console.info(children.length)
    for (let idx = 0; idx < children.length;) {
      let parent = ''
      let child = children[idx]
      console.info('get classes: ', idx, children.length, child)
      if (child.parent !== undefined) parent = child.parent
      let classes = {name: child.label, parent: parent}
      names.push(classes)
      if (child.children !== undefined) {
        for (let c of child.children) {
          if (!c.type || c.type === 'clz') children.push({label: c.label, parent: child.label, children: c.children})
        }
      }
      children.shift()
    }
    return names
  }
}

function isCategoryExist(state, name, parents) {
  let aParents = []
  if (parents) {
    aParents = parents.split('.')
  }
  let children = state.category
  for (let childName of aParents) {
    // console.info('children i', children)
    for (let item of children) {
      if (item.label === childName) {
        children = item.children
        break
      }
    }
  }
  // console.info('children', children, state.category)
  for (let item of children) {
    if (item.label === name) return true
  }
  return false
}

function isClass(node) {
  if (!node.type) return true
  if (node.type === 'clz') return true
}
function getNode(state, parents) {
  let nodes = state.category
  let node = null
  for (let item of parents) {
    for (let child of nodes) {
      if (child.label === item && isClass(child)) {
        node = child
        nodes = child.children
        break
      }
    }
  }
  return node
}

function isFileExist(nodes, data) {
  for (let node of nodes) {
    if (data.name === node.name) return true
  }
  return false
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
    console.info('add category', newName, chain, state.category)
    if (state.category === null) state.category = []
    let parent = state.category
    if (chain) {
      let chainNames = chain.split('.')
      for (let item of chainNames) {
        for (let child of parent) {
          if (child.name === item && child.type === 'dir') {
            parent = child.children
            break
          }
        }
      }
    }
    if (!isCategoryExist(state, newName, chain)) {
      parent.push({label: newName, type: 'dir'})
    }
  },
  setCategory(state, category) {
    console.info('set category', category)
    state.category = category
  },
  addImage2Category(state, data) {
    console.info('addImage2Category', data)
    const parents = data['parent'].split('.')
    let node = getNode(state, parents)
    if (node === null) return
    if (!node['children']) node['children'] = []
    const n = {label: data.label, id: data.id, type: 'img'}
    if (!isFileExist(node['children'], n)) {
      console.info('add category:', n)
      node['children'].push(n)
    }
  },
  removeImageFromCategory(state, data) {
    console.info('removeImageFromCategory', data)
    const parents = data['parent'].split('.')
    console.info(parents)
    let node = getNode(state, parents)
    let children = node['children']
    for (let idx in children) {
      if (children[idx].name === data.name && children[idx].type === 'img') {
        children.splice(idx, 1)
        break
      }
    }
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
  },
  addImage2Category({ commit }, data) {
    commit('addImage2Category', data)
  },
  removeImageFromCategory({ commit }, data) {
    commit('removeImageFromCategory', data)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
