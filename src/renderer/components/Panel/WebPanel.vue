<template>
  <div class="webview" @drop="dropFiles($event)" @dragover.prevent>
    <div style="height: 100%" v-html="html" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true"></div>
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
    dropFiles(event) {
      let files = event.dataTransfer.files
      let paths = []
      // const String = require('../../../public/String').default
      for (let item of files) {
        paths.push(item.path)
      }
      if (paths.length > 0) {
        this.$ipcRenderer.send(IPCNormalMessage.ADD_RESOURCES_BY_PATHS, paths)
      }
    },
    dragStart(event) {
      event.target.style.opacity = '0.5'
      // const fileisID = Object.keys(this.lastSelections)
      // console.info('drag start', fileisID)
      // event.dataTransfer.setData('civet', JSON.stringify(fileisID))
      // event.dataTransfer.setData('application/octet-stream', 'file://F:/Image/N1NtaWlwTDRsa0xTbnpiNjlOVTVLbjNGTDR0NGRDTk9QcVl3YjVnanEvL3NlQmRaREpIbjlnPT0.jpg')
      // event.dataTransfer.effectAllowed = 'copy'
    },
    dragEnd(event) {
      console.info('dragEnd from view', event.dataTransfer)
      event.target.style.opacity = ''
      event.preventDefault()
      // event.stopPropagation()
      // const url = event.dataTransfer.getData('text/plain')
      // console.info('copy URI:', url)
    },
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