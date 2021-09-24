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

export default {
  name: 'civet',
  components: {
    LandingPage,
    Guider
  },
  beforeMount() {
    // regist ipc message process function
    this.$ipcRenderer.on(IPCRendererResponse.ON_RESOURCE_UPDATED, this.onUpdateImages)
    this.$ipcRenderer.on(IPCRendererResponse.ON_ERROR_MESSAGE, this.onErrorTips)
  },
  mounted() {
    if (config.isFirstTime() || config.getCurrentDB() === undefined) {
      const guider = document.getElementById('guider')
      guider.showModal()
    }
    if (config.shouldUpgrade()) {
      config.save()
    }
    this.$nextTick(() => {
      this.$store.dispatch('init')
      // this.$commands.init()
    })
    // send this message to worker, and recieve workbench extension view for initial.
    this.$ipcRenderer.send(IPCNormalMessage.RENDERER_MOUNTED)
  },
  methods: {
    onUpdateImages(error, updateResources) {
      if (error) console.log(error)
      this.$store.dispatch('addFiles', updateResources)
      // console.info('add resources', updateResources)
      this.$events.emit('Overview', 'add', updateResources)
    },
    onErrorTips(info) {
      console.error(info)
      const h = this.$createElement
      this.$notify.error({
        title: info.msg,
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
