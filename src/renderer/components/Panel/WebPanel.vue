<template>
  <div class="webview">
    <div style="height: 100%" v-html="html"></div>
  </div>
</template>
<script>
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import ScriptLoader from '@/common/ScriptLoader'
import StyleLoader from '@/common/StyleLoader'

export default {
  name: 'web-container',
  data() {
    return {
      html: ''
    }
  },
  beforeMount() {
    this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, this.onPanelRouterInit)
  },
  mounted() {
    this.$ipcRenderer.send(IPCNormalMessage.REQUEST_UPDATE_RESOURCES)
  },
  methods: {
    onPanelRouterInit(session, value) {
      console.info('init overview', value)
      StyleLoader.load(value.style)
      this.html = value.body
      this.$nextTick(() => {
        ScriptLoader.load(value.script)
      })
    }
  }
}
</script>
<style scoped>
.webview {
  height: 100%;
}
</style>