<template>
  <div class="webview" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="extensionMenus" :underline="false" @ecmcb="onRightMenu" tag="overview"></PopMenu>
    <div style="height: 100%" @contextmenu.prevent @mousedown.right="onRightClick($event, $root)">
      <div style="height: 100%" v-html="html" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true"></div>
    </div>
  </div>
</template>
<script>
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import ScriptLoader from '@/common/ScriptLoader'
import StyleLoader from '@/common/StyleLoader'
import PopMenu from '@/components/Menu/PopMenu'

export default {
  name: 'web-container',
  components: { PopMenu },
  data() {
    return {
      html: '',
      menus: [
        // {text: '重命名', cb: this.onChangeName},
        // {text: '删除', cb: this.onDeleteItem}
      ],
      extensionMenus: []
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
      this.$nextTick(async () => {
        ScriptLoader.load(value.script)
        this.extensionMenus = await this.$ipcRenderer.get(IPCNormalMessage.GET_OVERVIEW_MENUS, 'overview/' + value.id)
        console.info('reply view menus', this.extensionMenus)
      })
    },
    onRightMenu: function (indexList, args1) {
      console.info('onRightMenu', indexList, args1)
    },
    onDeleteItem(name, parent, fileid) {
      // this.$ipcRenderer.send(Service.REMOVE_FILES, [fileid])
      this.$store.dispatch('removeFiles', [fileid])
    },
    onRightClick(event, root) {
      console.info('event', root)
      if (event.button === 2) { // 选择多个后右键
        // right click
        // this.imageSelected = false
        root.$emit('easyAxis', {
          tag: 'overview',
          index: 0,
          x: event.clientX,
          y: event.clientY
        })
      }
    }
  }
}
</script>
<style scoped>
.webview {
  height: 100%;
}
</style>