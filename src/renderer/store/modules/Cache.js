import FileBase from '@/../public/FileBase'
import Service from '@/components/utils/Service'
import { Tree, TreeNode } from '@/components/Control/Tree'
import Vue from 'vue'

const Cache = {
  query: {},
  files: {}
}
const maxCacheSize = 40 + 20 + 10

const state = {
  classes: new Tree([]),
  // classes: [{name: 'test', id: 2, count: 15, children: [{name: 'child', id: 3, count: 1, children: [{name: 'aaa', id: 5, count: 1, children: [{name: 'bbb', id: 7, count: 0}]}]}]}, {name: '测试', id: 4, count: 10}],
  classesName: [],
  viewItems: [],
  tags: {},
  allCount: 0,
  untags: 0,
  unclasses: 0,
  // router histories count
  histories: 0
}

const getters = {
  viewItems: state => (page = 0, size = 50) => {
    if (state.viewItems.length < size) {
      return state.viewItems
    }
    const start = page * size
    if (start < state.viewItems.length) {
      return state.viewItems
    }
  },
  classes: state => { return state.classes },
  getFiles: (state, getters) => {
    return (filesID) => {
      console.info('get files: ', filesID)
      let files = []
      for (let fileID of filesID) {
        const file = Cache.files[fileID]
        if (file !== null) {
          files.push(file)
        }
      }
      return files
    }
  },
  classesName: state => { return state.classesName },
  untags: state => { return state.untags },
  unclasses: state => { return state.unclasses },
  tags: state => { return state.tags },
  allCount: state => { return state.allCount },
  histories: state => { return state.histories }
}

const remote = {
  async recieveCounts() {
    const uncalsses = await Service.getServiceInstance().get(Service.GET_UNCATEGORY_IMAGES)
    const untags = await Service.getServiceInstance().get(Service.GET_UNTAG_IMAGES)
    console.info('untag is', untags, 'unclasses:', uncalsses)
    return {unclasses: uncalsses, untags: untags}
  },
  async recieveTags() {
    return Service.getServiceInstance().get(Service.GET_ALL_TAGS)
  }
}

const mutations = {
  init(state, data) {
    console.info('cache init', data)
    // let snaps = data.filesSnap
    // let imagesID = []
    // for (let snap of snaps) {
    //   imagesID.push(snap.id)
    //   // if (imagesID.length > 40) break
    // }
    const images = data.allImages
    for (let image of images) {
      Cache.files[image.id] = new FileBase(image)
      if (Cache.files.length > maxCacheSize) break
    }
    // const len = state.cache.length
    // setting view panel item
    mutations.display(state, data)
    // get classes
    let cls = data['allClasses']
    console.info('allClasses', cls)
    if (cls) {
      const addChildren = function (children, parent) {
        if (children && children.length > 0) {
          for (let i = 0; i < children.length; ++i) {
            if (typeof children[i] === 'object') {
              const child = new TreeNode({name: children[i].name, isLeaf: false})
              parent.addChildren(child, true)
              addChildren(children[i].children, child)
            }
          }
        }
      }
      for (let idx = 0; idx < cls.length; ++idx) {
        let clazz = cls[idx]
        if (!clazz) continue
        console.info('clazz:', clazz)
        // Vue.set(state.classes, idx, clazz)
        const root = new TreeNode({name: clazz.name, isLeaf: false})
        if (clazz['children'] && clazz['children'].length > 0) {
          addChildren(clazz['children'], root)
        }
        state.classes.addChildren(root)
      }
      console.info('class result', state.classes)
    }
    // init classes name
    const generateClassPath = (item, index, array) => {
      if (!array[index].parent) return
      let cpath
      if (array[index].parent.name !== 'root') {
        cpath = array[index].parent.name + '/' + item.name
      } else {
        cpath = item.name
      }
      // console.info('generateClassPath', cpath)
      state.classesName.push(cpath)
      let children = array[index].children
      if (!children) return
      children.map(generateClassPath)
      // classesPath.unshift(cpath)
    }
    if (state.classes.length) {
      let candidates = state.classes.children.map(generateClassPath)
      console.info('candidates', candidates, state.classes.children)
    }
    // count
    state.unclasses = data['unclasses'].length
    state.untags = data['untags'].length
    state.allCount = data.filesSnap.length
    // tags
    state.tags = data.allTags
  },
  addFiles(state, files) {
    let idx = 0
    console.info('addFiles:', files)
    for (let file of files) {
      if (Cache.files.hasOwnProperty(file.id)) {
        // TODO: update file info
        Cache.files[file.id].update(file)
        continue
      }
      Cache.files[file.id] = new FileBase(file)
      // setting view panel item
      if (Cache.files.length > maxCacheSize) break
      const pos = state.viewItems.length + idx
      Vue.set(state.viewItems, pos, Cache.files[file.id])
    }
  },
  display(state, data) {
    let idx = 0
    if (data) {
      // for (let datum of data) {}
    }
    for (let k in Cache.files) {
      Vue.set(state.viewItems, idx, Cache.files[k])
      idx += 1
      if (idx > maxCacheSize) break
    }
  },
  async query(state, result) {
    //   console.info('++++++')QUERY_FILES
    state.query = result
    state.viewItems.splice(0, state.viewItems.length)
    for (let idx = 0; idx < state.query.length; ++idx) {
      Vue.set(state.viewItems, idx, Cache.files[result[idx].id])
    }
    console.info(state.viewItems, result)
  },
  async addTag(state, mutation) {
    const {fileID, tag} = mutation
    console.info('cache add tag:', fileID, tag)
    const file = Cache.files[fileID]
    if (!file) {
      return
    }
    file.tag.push(tag)
    Service.getServiceInstance().send(Service.SET_TAG, {id: [fileID], tag: file.tag})
    // const {unclasses, untags} = await remote.recieveCounts()
    if (file.tag.length === 1) {
      state.untags += 1
    }
    // update tags
    // state.tags = await remote.recieveTags()
  },
  addClass(state, mutation) {
    if (Array.isArray(mutation)) {
      if (!state.classes.children) state.classes.children = []
      state.classes.addChildren(new TreeNode({name: mutation[0], isLeaf: false}))
      state.classesName.push(mutation[0])
      Service.getServiceInstance().send(Service.ADD_CATEGORY, mutation)
    } else if (typeof mutation === 'object') {
      let children = mutation.node
      let parent = mutation.parent
      parent.addChildren(children, true)
      // make path
      let classPath = children.name
      while (parent.parent !== null) {
        classPath = parent.name + '/' + classPath
        parent = parent.parent
      }
      state.classesName.push(classPath)
      console.info('classPath:', classPath)
      Service.getServiceInstance().send(Service.ADD_CATEGORY, [classPath])
    }
  },
  addClassOfFile(state, mutation) {
    const fileid = mutation.id
    const classpath = mutation.path
    console.info('addClassOfFile', fileid, classpath)
    let file = Cache.files[fileid]
    console.info(file)
    if (!file.category) file.category = []
    file.category.push(classpath)
    Service.getServiceInstance().send(Service.ADD_CATEGORY, {id: [fileid], class: [classpath]})
  },
  removeClass(state, mutation) {
    console.info('remove class', mutation, state.classesName)
    if (Array.isArray(mutation)) {
      for (let clsName of mutation) {
        // remove from className
        state.classesName.splice(state.classesName.indexOf(clsName), 1)
        // remove from classes
        for (let idx = state.classes.length - 1; idx >= 0; --idx) {
          if (state.classes[idx].name === clsName) {
            state.classes.splice(idx, 1)
            break
          }
        }
        // remove from relavent files
        for (let fileid in Cache.files) {
          let file = Cache.files[fileid]
          // console.info(file)
          let pos = file.category.indexOf(clsName)
          if (pos >= 0) file.category.splice(pos, 1)
        }
      }
    } else {
      let classPath = mutation.name
      // class path
      let node = mutation.parent
      while (node.parent !== null) {
        classPath = node.name + '/' + classPath
        node = node.parent
      }
      console.info('delete class path:', classPath, 'node', mutation)
      mutation.remove()
      state.classesName.splice(state.classesName.indexOf(classPath), 1)
      Service.getServiceInstance().send(Service.REMOVE_CLASSES, [classPath])
    }
  },
  removeClassOfFile(state, mutation) {
    let fileid = mutation.id
    let classpath = mutation.path
    console.info('remove class of file', fileid, classpath)
    let file = Cache.files[fileid]
    for (let idx = 0; idx < file.category.length; ++idx) {
      if (file.category[idx] === classpath) {
        file.category.splice(idx, 1)
        Service.getServiceInstance().send(Service.REMOVE_CLASSES, {id: [fileid], class: [classpath]})
        break
      }
    }
  },
  changeClassName(state, mutation) {
    console.info('changeClassName', mutation, state.classesName)
    const indx = state.classesName.indexOf(mutation.old)
    state.classesName[indx] = mutation.new
    Service.getServiceInstance().send(Service.UPDATE_CATEGORY_NAME, {oldName: mutation.old, newName: mutation.new})
  },
  changeFileName(state, mutation) {
    console.info('changeFileName', mutation)
  },
  removeFiles(state, filesid) {
    for (let idx = 0; idx < filesid.length; ++idx) {
      // remove from cache
      Vue.delete(Cache.files, filesid[idx])
    }
    // remove from db
    Service.getServiceInstance().send(Service.REMOVE_FILES, filesid)
  },
  removeTags(state, mutation) {
    Service.getServiceInstance().send(Service.REMOVE_TAG, {tag: [mutation.tag], filesID: [mutation.id]})
    let file = Cache.files[mutation.id]
    file.tag.splice(file.tag.indexOf(mutation.tag), 1)
  },
  update(state, sql) {},
  updateHistoryLength(state, value) {
    state.histories = value
  },
  updateCount(state, counts) {
    // count
    state.unclasses = counts.unclasses.length
    state.untags = counts.untags.length
  },
  getClassesAndFiles(state, classesFiles) {
    console.info('getClassesAndFiles', classesFiles)
  }
}

const actions = {
  async init({ commit }, flag) {
    const {unclasses, untags} = await remote.recieveCounts()
    const allClasses = await Service.getServiceInstance().get(Service.GET_ALL_CATEGORY, '/')
    console.info('all classes:', allClasses)
    const filesSnap = await Service.getServiceInstance().get(Service.GET_FILES_SNAP)
    let imagesID = []
    for (let snap of filesSnap) {
      imagesID.push(snap.id)
      if (imagesID.length > maxCacheSize) break
    }
    const allImages = await Service.getServiceInstance().get(Service.GET_IMAGES_INFO, imagesID)
    const allTags = await Service.getServiceInstance().get(Service.GET_ALL_TAGS)
    console.info('recieveCounts:', unclasses)
    commit('init', {unclasses, untags, allClasses, filesSnap, allImages, allTags})
  },
  async query({commit}, query) {
    const result = await Service.getServiceInstance().get(Service.QUERY_FILES, query)
    console.info('query: ', query, 'result: ', result)
    commit('query', result)
  },
  display({commit}, data) {
    commit('display', data)
  },
  removeFiles({commit}, files) {
    commit('removeFiles', files)
  },
  async addFiles({commit}, files) {
    commit('addFiles', files)
    // count
    const counts = await remote.recieveCounts()
    commit('updateCounts', counts)
  },
  addTag({commit}, mutation) {
    commit('addTag', mutation)
  },
  addClass({commit}, mutation) {
    commit('addClass', mutation)
  },
  async addClassOfFile({commit}, mutation) {
    await commit('addClassOfFile', mutation)
  },
  removeClass({commit}, node) {
    commit('removeClass', node)
  },
  async removeClassOfFile({commit}, mutation) {
    await commit('removeClassOfFile', mutation)
  },
  removeTags({commit}, mutation) {
    commit('removeTags', mutation)
  },
  changeFileName({commit}, mutation) {
    commit('changeFileName', mutation)
  },
  changeClassName({commit}, mutation) {
    commit('changeClassName', mutation)
  },
  async getClassesAndFiles({commit}, query) {
    const allClasses = await Service.getServiceInstance().get(Service.GET_ALL_CATEGORY, query)
    commit('getClassesAndFiles', allClasses)
  },
  update({commit}, sql) {
    /*
     *  sql like: {query:'', $set:{}}, {query:'', $unset:{}}
     */
    commit('update', sql)
  },
  remove({commit}, sql) {
    /*
     *  sql like: {query:''}
     */
    commit('update', sql)
  },
  insert({commit}, sql) {
    /*
     *  sql like: {query:'', value: {}}
     */
  },
  updateHistoryLength({commit}, value) {
    commit('updateHistoryLength', value)
  }
}

// const utils = {
//   getFileFromCache: () => {}
// }
export default {
  state,
  getters,
  mutations,
  actions
}
