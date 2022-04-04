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
    this.$events.on('civet', 'onErrorMessage', this.onErrorTips)
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
      })
    }
    if (config.shouldUpgrade()) {
      config.save()
    }
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
            return prop
          }
        }
        return undefined
      }
      console.info('add new', updateResources)
      for (let resource of updateResources) {
        if (!isThumbnailExist(resource)) {
          if (resource.thumbnail === null) {
            const width = 300
            const height = 600
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
      }
      this.$events.emit('Overview:' + view, 'add', updateResources)
      this.$store.dispatch('addFiles', updateResources)
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
    }
  },
  destroyed: function() {
    // const Storage = require('../public/Kernel')
    // Storage.release()
  }
}
</script>
