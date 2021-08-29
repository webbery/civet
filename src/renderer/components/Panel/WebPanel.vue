<template>
  <div class="webview">
    <div style="height: 100%" v-html="html"></div>
  </div>
</template>
<script>
import { IPCRendererResponse } from '@/../public/IPCMessage'
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
  },
  methods: {
    onPanelRouterInit(session, id, classname, value) {
      StyleLoader.load(value.style)
      this.html = value.html
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