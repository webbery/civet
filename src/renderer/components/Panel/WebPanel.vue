<template>
  <div class="webview" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="extensionMenus" :underline="false" @ecmcb="onRightMenu" tag="overview"></PopMenu>
    <div style="height: 100%" @mousedown.right="onRightClick($event, $root)">
      <div style="height: 100%" v-html="html" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true"></div>
    </div>
  </div>
</template>
<script>
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import ScriptLoader from '@/common/ScriptLoader'
import StyleLoader from '@/common/StyleLoader'
import PopMenu from '@/components/Menu/PopMenu'
import bus from '../utils/Bus'
import { clearArgs, events } from '../../common/RendererService'
import { InternalCommand, commandService } from '@/common/CommandService'
import { config } from '@/../public/CivetConfig'

export default {
  name: 'web-container',
  components: { PopMenu },
  data() {
    return {
      html: '',
      menus: [
        // {text: '重命名', cb: this.onChangeName},
        // {text: '导出到计算机', cb: this.onExportFiles},
        // {text: '删除', cb: this.onDeleteItem}
      ],
      extensionMenus: []
    }
  },
  beforeMount() {
    this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, this.onPanelRouterInit)
  },
  mounted() {
    console.info('web panel mounted', config.defaultView)
    // this.$ipcRenderer.send(IPCNormalMessage.REQUEST_UPDATE_RESOURCES)
    this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_OVERVIEW, config.defaultView)
  },
  watch: {
    $route: function(to, from) {
      console.info('to: ', to, 'from:', from.path)
      let name = to.query.name
      if (name === undefined) {
        name = '全部'
      }
      switch (to.path) {
        case '/':
          // this.$store.dispatch('display')
          // console.info('Overview update', this.$store)
          this.$events.emit('Overview', 'update', {
            'class': this.$store.state.Cache.viewClass,
            'resource': this.$store.state.Cache.viewItems
          })
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-all'})
          break
        case '/uncategory':
          this.$events.emit('Overview', 'update', {resource: this.$store.state.Cache.viewItems})
          break
        case '/untag':
          this.$events.emit('Overview', 'update', {resource: this.$store.state.Cache.viewItems})
          break
        case '/query':
          switch (to.query.type) {
            case 'tag':
              bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-tag'})
              break
            case 'keyword':
              bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-keyword'})
              break
            default:
              break
          }
          break
        default:
          break
      }
    }
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
      const self = this
      this.$nextTick(async () => {
        ScriptLoader.load(value.script)
        // console.info(value, 'menu is', menus)
        const menus = await this.$ipcRenderer.get(IPCNormalMessage.GET_OVERVIEW_MENUS, 'overview/' + value.id)
        this.extensionMenus = []
        for (let menu of menus) {
          this.extensionMenus.push({
            id: value.id,
            name: menu.name,
            command: menu.command
          })
          if (this.isInternalCommand(menu.command)) {
            commandService.registInternalCommand(value.id, menu.command, self)
          } else {
            events.on(value.id, menu.command, function(args) {
              console.info('on event', menu.command)
              self.$ipcRenderer.send(IPCNormalMessage.POST_COMMAND, {target: value.id, command: 'ext:' + menu.command, args: args})
            })
          }
        }
        console.info('reply view menus', this.extensionMenus, menus)
      })
    },
    isInternalCommand(command) {
      switch (command) {
        case InternalCommand.DeleteResources:
        case InternalCommand.ExportResources:
          return true
        default:
          return false
      }
    },
    onRightMenu: function (indexList, args1) {
      console.info('onRightMenu', indexList, args1)
    },
    onDeleteItem(name, parent, fileid) {
      this.$store.dispatch('removeFiles', [fileid])
    },
    onRightClick(event, root) {
      console.info('event', root)
      if (event.button === 2) { // 选择多个后右键
        // right click
        // this.imageSelected = false
        clearArgs()
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