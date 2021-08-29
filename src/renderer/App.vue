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
// import CV from '@/../public/ImageProcess'
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
    // this.$ipcRenderer.on(IPCRendererResponse.ON_FILE_UPDATE, this.onUpdateImages)
    this.$ipcRenderer.on(IPCRendererResponse.ON_ERROR_MESSAGE, this.onErrorTips)
    // this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, this.onPanelRouterInit)
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
    })
    // send this message to worker, and recieve workbench extension view for initial.
    this.$ipcRenderer.send(IPCNormalMessage.RENDERER_MOUNTED)
  },
  methods: {
    onUpdateImages(error, updateImages) {
      if (error) console.log(error)
      this.$store.dispatch('addFiles', updateImages)
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
    },
    onPanelRouterInit(session, id, classname, value) {
      const path = '/' + classname + '/' + id
      console.info('onPanelRouterInit', session, id, classname, value, path)
      // this.$router.addRoutes([{
      //   path: path,
      //   name: id,
      //   component: value.html
      // }])
    }
  },
  destroyed: function() {
    // const Storage = require('../public/Kernel')
    // Storage.release()
  }
}
</script>
