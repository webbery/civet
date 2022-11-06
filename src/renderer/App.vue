<template>
  <div id="app">
    <LandingPage></LandingPage>
    <dialog id="guider" class="modal">
      <label>配置你的第一个资源库:</label>
      <Guider @onclose="onCloseGuider" @onsuccess="onCloseGuider"></Guider>
    </dialog>
    <!-- <Guider ref="guider"></Guider> -->
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import Guider from '@/components/Dialog/Guider'
import { config } from '@/../public/CivetConfig'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import { getCurrentViewName } from '@/common/RendererService'
import { text2PNG } from '@/../public/Utility'
import { Cache } from '@/store/modules/CacheInstance'
import { isEmpty } from '@/../public/String'
import { Shortcut, keyDownHandler } from './shortcut/Shortcut'

export default {
  name: 'civet',
  components: {
    LandingPage,
    Guider
  },
  beforeMount() {
    // regist ipc message process function
    this.$ipcRenderer.on(IPCRendererResponse.ON_RESOURCE_UPDATED, this.onUpdateResources)
    this.$ipcRenderer.on(IPCRendererResponse.ON_ERROR_MESSAGE, this.onErrorTips)
    this.$ipcRenderer.on(IPCRendererResponse.ON_I18N, this.onI18N)
    this.$ipcRenderer.on(IPCRendererResponse.ON_MANAGEBENCH_INIT, this.onManagebenchInit)
    this.$ipcRenderer.on('keydown', this.onSystemKeydown)
    this.$events.on('civet', IPCRendererResponse.ON_ERROR_MESSAGE, this.onErrorTips)
  },
  mounted() {
    console.info('mount:', config)
    if (config.isFirstTime() || config.getCurrentDB() === undefined) {
      const guider = document.getElementById('guider')
      guider.showModal()
    } else {
      console.debug('next tick envoke')
      this.$nextTick(() => {
        this.$store.dispatch('init')
        this.$events.on('civet', 'showResourceDetail', this.onResourceShow)
        this.$events.on('civet', 'openClass', this.onClassOpen)
        this.$events.on('civet', 'changeResourceName', this.onCommandChangeName)
      })
    }
    if (config.shouldUpgrade()) {
      config.save()
    }
    document.addEventListener('keydown', keyDownHandler(this))
    // send this message to worker, and recieve workbench extension view for initial.
    this.$ipcRenderer.send(IPCNormalMessage.RENDERER_MOUNTED)
  },
  methods: {
    async onUpdateResources(error, updateResources) {
      if (error) console.log(error)
      for (const resource of updateResources) {
        if (Cache.files[resource.id]) {
          this.$store.dispatch('addFiles', updateResources)
          return
        }
      }
      const view = getCurrentViewName()
      const isThumbnailExist = (resource) => {
        const meta = resource['meta']
        for (let prop of meta) {
          if (prop['name'] === 'thumbnail') {
            return prop['value']
          }
        }
        return undefined
      }
      let dumplicateID = new Set()
      let addedResources = []
      for (let resource of updateResources) {
        if (!isThumbnailExist(resource)) {
          if (resource.thumbnail === undefined) continue
          if (resource.thumbnail === null) {
            const width = 120
            const height = 180
            const type = resource.type || resource.filetype
            const png = text2PNG(type, width, height)
            resource.thumbnail = png
            resource['meta'].push(
              {
                name: 'thumbnail',
                value: resource.thumbnail
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
        if (dumplicateID.has(resource.id)) continue
        dumplicateID.add(resource.id)
        addedResources.push(resource)
      }
      console.info('add new', addedResources)
      this.$events.emit('Overview:' + view, 'add', addedResources)
      this.$store.dispatch('addFiles', addedResources)
    },
    async onResourceShow(resource) {
      const resourceID = resource['id']
      if (!resourceID) {
        console.error(`show resource ${resource} fail`)
        return
      }
      let resourceInfo = await this.$ipcRenderer.get(IPCNormalMessage.RENDERER_GET_RESOURCE_INFO, resourceID)
      if (resourceInfo !== null) {
        resourceInfo['id'] = resourceID
        console.info('onResourceShow:', resourceInfo)
        this.$router.push({name: 'view-resource', params: resourceInfo, query: {name: resourceInfo.filename || resourceInfo.name, cmd: 'display'}})
      }
    },
    onClassOpen(classpath) {
      console.info('open class', classpath)
      this.$store.dispatch('getClassesAndFiles', classpath.params)
    },
    onCommandChangeName(resource) {
      console.debug('onCommandChangeName', resource)
      const params = resource.params
      if (params.id !== undefined && !isEmpty(params.name)) {
        this.$store.dispatch('changeFileName', {id: params.id, filename: params.name})
      }
    },
    onErrorTips(info) {
      console.error(info)
      const h = this.$createElement
      this.$notify.error({
        title: info.msg || info,
        dangerouslyUseHTMLString: true,
        message: h('div', {style: 'color: white; font-size: 12px;'}, info.path),
        // duration: 0,
        position: 'bottom_right'
      })
    },
    onCloseGuider() {
      const cfg = document.getElementById('guider')
      cfg.close()
    },
    onI18N(i18n) {
      console.debug('on i18n:', i18n)
      this.$store.commit('upsetI18n', i18n)
    },
    onSystemKeydown(params) {
      console.debug('system keydown:', params)
      const key = params.toLowerCase()
      const func = Shortcut.get(key)
      if (func) func()
    },
    initializeShortcut() {
      // globalShortcut
      // globalShortcut.unregister('CommandOrControl+R')
    },
    onManagebenchInit(bindData) {
      this.$store.dispatch('bindExtension', bindData)
    }
  },
  destroyed: function() {
    // const Storage = require('../public/Kernel')
    // Storage.release()
  }
}
</script>
