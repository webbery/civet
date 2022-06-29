import { Resource } from '@/../public/Resource'
import { TreeNode } from '@/components/Control/Tree'
import { IPCNormalMessage } from '@/../public/IPCMessage'
import { service, events, getCurrentViewName } from '@/common/RendererService'
import { isEmpty, text2PNG } from '@/../public/Utility'
import Vue from 'vue'
import { Cache } from './CacheInstance'
import * as Assist from './CacheAssist'
import { config } from '@/../public/CivetConfig'
import { Search } from '@/common/SearchManager'
import { PerformanceObserver, performance } from 'perf_hooks'
import { performanceMesurement } from '@/common/PerformanceMesurement'

function updateOverview(state, showClasses) {
  const view = getCurrentViewName()
  if (showClasses) {
    events.emit('Overview:' + view, 'update', {
      'class': state.viewClass,
      'resource': state.viewItems
    })
  } else {
    events.emit('Overview:' + view, 'update', {
      'class': [],
      'resource': state.viewItems
    })
  }
}

function initResource(file) {
  const resource = new Resource(file)
  Cache.files[file.id] = resource
  return resource
}

const state = {
  resources: [],
  currentResource: '',
  classes: new TreeNode({ name: 'root', isLeaf: false, id: 0 }),
  // classes: [{name: 'test', id: 2, count: 15, children: [{name: 'child', id: 3, count: 1, children: [{name: 'aaa', id: 5, count: 1, children: [{name: 'bbb', id: 7, count: 0}]}]}]}, {name: '测试', id: 4, count: 10}],
  classesName: [],
  viewItems: [],
  viewClass: [],
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
  viewClass: state => {
    return state.viewClass
  },
  resources: state => { return state.resources },
  currentResource: state => state.currentResource,
  classes: state => { return state.classes },
  getFiles: (state, getters) => {
    return (filesID) => {
      console.info('get files: ', filesID)
      const files = []
      for (const fileID of filesID) {
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
  histories: state => { return state.histories },
  i18n: (state, getters) => {
    return (key) => {
      console.debug('get i18n:', key, Cache.i18n)
      return Cache.i18n[key] || key
    }
  }
}

const remote = {
  async recieveCounts() {
    const uncalsses = await service.get(IPCNormalMessage.GET_UNCATEGORY_RESOURCES)
    const untags = await service.get(IPCNormalMessage.GET_UNTAG_RESOURCES)
    console.info('untag is', untags, 'unclasses:', uncalsses)
    return { unclasses: uncalsses, untags: untags }
  },
  async recieveTags() {
    return service.get(IPCNormalMessage.GET_ALL_TAGS)
  }
}

const mutations = {
  initViewResources(state, viewResources) {
    state.viewItems.splice(0, state.viewItems.length)
    const resources = viewResources
    for (const image of resources) {
      const resource = initResource(image)
      state.viewItems.push(resource)
    }
    performanceMesurement.mark('init view resources end')
    performanceMesurement.measure('view display time:', 'init resouce view begin', 'init view resources end')
  },
  init(state, data) {
    console.info('cache init', data)
    state.currentResource = config.getCurrentDB()
    state.resources.splice(0, state.resources.length)
    const names = config.getResourcesName()
    for (let idx = 0, len = names.length; idx < len; ++idx) {
      Vue.set(state.resources, idx, names[idx])
    }
    Cache.snaps = data.filesSnap
    // const len = state.cache.length
    // get classes
    const cls = data.allClasses
    console.info('allClasses', cls)
    if (cls) {
      const addChildren = function (children, parent) {
        if (children && children.length > 0) {
          for (let i = 0; i < children.length; ++i) {
            if (typeof children[i] === 'object') {
              const child = new TreeNode({ name: children[i].name, isLeaf: false, count: children[i].count })
              parent.addChildren(child, true)
              addChildren(children[i].children, child)
            }
          }
        }
      }
      for (let idx = 0; idx < cls.length; ++idx) {
        const clazz = cls[idx]
        if (!clazz) continue
        console.info('clazz:', clazz)
        // Vue.set(state.classes, idx, clazz)
        const root = new TreeNode({ name: clazz.name, isLeaf: false, count: clazz.count })
        if (clazz.children && clazz.children.length > 0) {
          addChildren(clazz.children, root)
        }
        state.classes.addChildren(root)
        state.viewClass.push({name: clazz.name})
      }
      console.info('class result', state.classes)
      performanceMesurement.mark('init view infomation end')
      performanceMesurement.measure('infomation display time:', 'init view infomation begin', 'init view infomation end')
    }
    updateOverview(state, true)
    // init classes name
    const generateClassPath = (item, index, array) => {
      if (!array[index].parent) return
      let cpath
      if (array[index].parent.name !== 'root') {
        cpath = array[index].parent.name + '/' + item.name
      } else {
        cpath = item.name
      }
      console.info('generateClassPath', cpath)
      state.classesName.push(cpath)
      const children = array[index].children
      if (!children) return
      children.map(generateClassPath)
    }
    if (state.classes && state.classes.children && state.classes.children.length) {
      const candidates = state.classes.children.map(generateClassPath)
      console.info('candidates', candidates, state.classes.children)
    }
    // count
    state.unclasses = data.unclasses.length
    state.untags = data.untags.length
    state.allCount = data.filesSnap.length
    // tags
    state.tags = data.allTags
    console.info('init finish')
  },
  addFiles(state, files) {
    // const idx = 0
    console.info('addFiles:', files)
    let cnt = 0
    for (const file of files) {
      if (Cache.files.hasOwnProperty(file.id)) {
        // TODO: update file info
        Cache.files[file.id].update(file)
        continue
      }
      initResource(file)
      cnt += 1
      // setting view panel item
      // if (Cache.files.length > maxCacheSize) break
      state.viewItems.push(Cache.files[file.id])
      // const pos = state.viewItems.length + idx
      // Vue.set(state.viewItems, pos, Cache.files[file.id])
    }
    state.allCount += cnt
  },
  display(state, data) {
    console.info('emit display')
    if (!events) {
      console.error('event is empty')
      return
    }
    updateOverview(state, true)
  },
  query(state, result) {
    state.viewItems.splice(0, state.viewItems.length)
    if (!result) return
    for (let idx = 0; idx < result.length; ++idx) {
      state.viewItems.push(Cache.files[result[idx].id])
    }
    const view = getCurrentViewName()
    events.emit('Overview:' + view, 'update', {
      'resource': state.viewItems
    })
  },
  updateTag(state, info) {
    // const {unclasses, untags} = await remote.recieveCounts()
    state.untags = info.untags.length
    // update tags
    state.tags = info.tags
  },
  updateViewResources(state, data) {
    state.viewItems.splice(0, state.viewItems.length)
    for (let idx = 0, len = data.length; idx < len; ++idx) {
      Vue.set(state.viewItems, idx, Cache.files[data[idx]])
    }
    updateOverview(state, false)
  },
  upsetI18n(state, data) {
    for (const key in data) {
      Cache.i18n[key] = data[key]
    }
  },
  // addTag(state, info) {
  //   const { fileID, tag } = info
  //   const file = state.files[fileID]
  //   if (!file) {
  //     return
  //   }
  //   file.tag.push(tag)
  // },
  addClass(state, mutation) {
    if (Array.isArray(mutation)) {
      if (!state.classes.children) state.classes.children = []
      state.classes.addChildren(new TreeNode({ name: mutation[0], isLeaf: false, editable: true }))
      if (isEmpty(mutation[0])) return
      this.addClassName(mutation[0])
    } else if (typeof mutation === 'object') {
      const children = mutation.node
      let parent = mutation.parent
      parent.addChildren(children, true)
      // make path
      if (isEmpty(children.name)) return
      let classPath = children.name
      while (parent.parent !== null) {
        classPath = parent.name + '/' + classPath
        parent = parent.parent
      }
      this.addClassName([classPath])
    }
  },
  addClassName(state, names) {
    if (!names.length) {
      state.classesName.push(names)
      service.send(IPCNormalMessage.ADD_CLASSES, names)
    } else {
      state.classesName.push(names)
      console.info('classPath:', names)
      service.send(IPCNormalMessage.ADD_CLASSES, names)
    }
  },
  addClassOfFile(state, mutation) {
    const fileid = mutation.id
    const classpath = mutation.path
    console.info('addClassOfFile', fileid, classpath)
    const file = Cache.files[fileid]
    console.info(file)
    if (!file.category) file.category = []
    file.category.push(classpath)
    state.classes.increaseChildrenCount(classpath, 1)
    service.send(IPCNormalMessage.ADD_CLASSES, { id: [fileid], class: [classpath] })
  },
  removeClass(state, mutation) {
    console.info('remove class', mutation, state.classesName)
    if (Array.isArray(mutation)) {
      for (const clsName of mutation) {
        Assist.removeClass(state, clsName)
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
      service.send(IPCNormalMessage.REMOVE_CLASSES, [classPath])
    }
  },
  removeClassOfFile(state, mutation) {
    const fileid = mutation.id
    const classpath = mutation.path
    console.info('remove class of file', fileid, classpath)
    const file = Cache.files[fileid]
    for (let idx = 0; idx < file.category.length; ++idx) {
      if (file.category[idx] === classpath) {
        file.category.splice(idx, 1)
        service.send(IPCNormalMessage.REMOVE_CLASSES, { id: [fileid], class: [classpath] })
        break
      }
    }
    state.classes.minusChildrenCount(classpath, 1)
  },
  changeClassName(state, mutation) {
    console.info('changeClassName', mutation, state.classesName)
    const indx = state.classesName.indexOf(mutation.old)
    state.classesName[indx] = mutation.new
    updateOverview(state, true)
    service.send(IPCNormalMessage.UPDATE_CATEGORY_NAME, { oldName: mutation.old, newName: mutation.new })
  },
  changeFileName(state, mutation) {
    console.info('changeFileName', mutation)
    const fileid = mutation.id
    Cache.files[fileid].filename = mutation.filename
    service.send(IPCNormalMessage.UPDATE_RESOURCE_NAME, mutation)
    const view = getCurrentViewName()
    events.emit('Overview:' + view, 'property', {
      'id': mutation.id,
      'name': mutation.filename
    })
  },
  removeFiles(state, filesid) {
    for (let idx = 0; idx < filesid.length; ++idx) {
      // remove from cache
      Vue.delete(Cache.files, filesid[idx])
    }
    let removeCnt = 0
    for (let idx = 0; idx < state.viewItems.length; ++idx) {
      if (removeCnt === filesid.length) break
      for (let fidx = filesid.length - 1; fidx >= 0; --fidx) {
        if (state.viewItems[idx].id === filesid[fidx]) {
          Vue.delete(state.viewItems, idx)
          removeCnt += 1
          break
        }
      }
    }
    console.info('remove files', filesid, state.viewItems.length)
    updateOverview(state, true)
    state.allCount -= removeCnt
    // remove from db
    service.send(IPCNormalMessage.REMOVE_RESOURCES, filesid)
  },
  removeTags(state, mutation) {
    service.send(IPCNormalMessage.REMOVE_TAG, { tag: [mutation.tag], filesID: [mutation.id] })
    const file = Cache.files[mutation.id]
    file.tag.splice(file.tag.indexOf(mutation.tag), 1)
  },
  update(state, sql) {},
  updateHistoryLength(state, value) {
    state.histories = value
  },
  updateCounts(state, counts) {
    // count
    state.unclasses = counts.unclasses.length
    state.untags = counts.untags.length
  },
  getClassesAndFiles(state, classesFiles) {
    console.debug('getClassesAndFiles', classesFiles)
    state.viewClass.splice(0, state.viewClass.length)
    state.viewItems.splice(0, state.viewItems.length)
    if (classesFiles.length === 1) {
      let clsIdx = 0
      let fileIdx = 0
      const items = classesFiles[0]
      for (let idx = 0, len = items.length; idx < len; ++idx) {
        if (items[idx].type === 'clz') {
          const item = {}
          item.path = items[idx].name
          const pos = items[idx].name.lastIndexOf('/') + 1
          item.name = items[idx].name.substring(pos)
          Vue.set(state.viewClass, clsIdx++, item)
        } else {
          Vue.set(state.viewItems, fileIdx++, Cache.files[items[idx].id])
        }
      }
    } else {
      const [resources, classes] = classesFiles
      for (let idx = 0, len = classes.length; idx < len; ++idx) {
        const item = {}
        item.name = classes[idx].name
        item.path = classes[idx].name
        Vue.set(state.viewClass, idx, item)
      }
      for (let idx = 0, len = resources.length; idx < len; ++idx) {
        Vue.set(state.viewItems, idx, Cache.files[resources[idx]])
      }
    }
    updateOverview(state, true)
    console.info('display classes', state.viewClass)
  },
  clear(state, data) {
    state.viewItems = []
    Cache.files = {}
  },
  addResource(state, data) {
    config.addResource(data)
    config.save()
    state.resources.push(data)
  },
  delResource(state, name) {
    config.removeResource(name)
    for (let idx = 0, len = state.resources.length; idx < len; ++idx) {
      if (state.resources[idx] === name) {
        Vue.delete(state.resources, idx)
        break
      }
    }
    state.currentResource = config.getCurrentDB()
  },
  switchResource(state, name) {
    console.info('switchResource', name)
    config.switchResource(name)
    config.save()
    state.currentResource = name
  }
}

const actions = {
  async init({ commit }, flag) {
    try {
      performanceMesurement.mark('init resouce view begin')
      const filesSnap = await service.get(IPCNormalMessage.GET_RESOURCES_SNAP)
      const imagesID = []
      for (const snap of filesSnap) {
        imagesID.push(snap.id)
        // if (imagesID.length > maxCacheSize) break
      }
      const allResources = await service.get(IPCNormalMessage.RENDERER_GET_RESOURCES_INFO, imagesID)
      for (let item of allResources) {
        if (!item.thumbnail) {
          const width = 120
          const height = 180
          const type = item.type || item.filetype
          const png = text2PNG(type, width, height)
          Cache.icons[type] = png
          item.thumbnail = png
          item['meta'].push(
            {
              name: 'thumbnail',
              value: item.thumbnail
            },
            {
              name: 'width',
              value: width
            },
            {
              name: 'height',
              value: height
            }
          )
        }
      }
      commit('initViewResources', allResources)
      performanceMesurement.mark('init view infomation begin')
      const { unclasses, untags } = await remote.recieveCounts()
      const allClasses = await service.get(IPCNormalMessage.GET_ALL_CLASSES, '/')
      console.info('all classes:', allClasses)
      const allTags = await service.get(IPCNormalMessage.GET_ALL_TAGS)
      console.info('recieveCounts:', unclasses, 'tags:', allTags)
      commit('init', { unclasses, untags, allClasses, filesSnap, allTags })
    } catch (err) {
      console.error(err)
      if (config.getCurrentDB() === undefined) {
        const guider = document.getElementById('guider')
        guider.showModal()
      }
    }
  },
  async query({ commit }, query) {
    const result = await Search.update(query)
    console.info('result: ', result)
    commit('query', result)
  },
  display({ commit }, data) {
    commit('display', data)
  },
  removeFiles({ commit }, files) {
    commit('removeFiles', files)
  },
  async addFiles({ commit }, files) {
    await commit('addFiles', files)
    // count
    const counts = await remote.recieveCounts()
    await commit('updateCounts', counts)
  },
  async addTag({ commit }, mutation) {
    const { fileID, tag } = mutation
    console.info('cache add tag:', fileID, tag)
    // await commit('addTag', mutation)
    const file = Cache.files[fileID]
    if (!file) {
      return
    }
    console.info('file:', file)
    file.tag.push(tag)
    service.send(IPCNormalMessage.SET_TAG, { id: [fileID], tag: file.tag })
    const tags = await remote.recieveTags()
    const { ...counts } = await remote.recieveCounts()
    commit('updateTag', {tags, untags: counts.untags})
  },
  addClass({ commit }, mutation) {
    commit('addClass', mutation)
  },
  async addClassOfFile({ commit }, mutation) {
    await commit('addClassOfFile', mutation)
  },
  removeClass({ commit }, node) {
    commit('removeClass', node)
  },
  async removeClassOfFile({ commit }, mutation) {
    await commit('removeClassOfFile', mutation)
  },
  removeTags({ commit }, mutation) {
    commit('removeTags', mutation)
  },
  changeFileName({ commit }, mutation) {
    commit('changeFileName', mutation)
  },
  changeClassName({ commit }, mutation) {
    if (mutation.old[mutation.old.length - 1] === '/' || isEmpty(mutation.old)) {
      commit('addClassName', mutation.new)
      return
    }
    commit('changeClassName', mutation)
  },
  async getClassesAndFiles({ commit }, query) {
    console.info('query', query)
    if (query === '/') {
      const allResources = await service.get(IPCNormalMessage.GET_UNCATEGORY_RESOURCES)
      const allClasses = await service.get(IPCNormalMessage.GET_ALL_CLASSES, '/')
      commit('getClassesAndFiles', [allResources, allClasses])
    } else {
      const detail = await service.get(IPCNormalMessage.GET_CLASSES_DETAIL, query)
      commit('getClassesAndFiles', [detail])
    }
  },
  async getUncategoryResources({ commit }) {
    const uncalsses = await service.get(IPCNormalMessage.GET_UNCATEGORY_RESOURCES)
    commit('updateViewResources', uncalsses)
  },
  async getUntagResources({ commit }) {
    const untags = await service.get(IPCNormalMessage.GET_UNTAG_RESOURCES)
    commit('updateViewResources', untags)
  },
  upsetI18n({commit}, data) {
    commit('upsetI18n', data)
  },
  clear({ commit }, data) {
    commit('clear', data)
  },
  update({ commit }, sql) {
    /*
     *  sql like: {query:'', $set:{}}, {query:'', $unset:{}}
     */
    commit('update', sql)
  },
  remove({ commit }, sql) {
    /*
     *  sql like: {query:''}
     */
    commit('update', sql)
  },
  insert({ commit }, sql) {
    /*
     *  sql like: {query:'', value: {}}
     */
  },
  updateHistoryLength({ commit }, value) {
    commit('updateHistoryLength', value)
  },
  delResource({commit}, name) {
    commit('delResource', name)
  },
  addResource({commit}, data) {
    commit('addResource', data)
  },
  switchResource({commit}, name) {
    commit('switchResource', name)
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
