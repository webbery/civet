<template>
  <div class="webview" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="extensionMenus" :underline="false" @ecmcb="onRightMenu" tag="overview"></PopMenu>
    <div style="height: 100%" @mousedown.right="onRightClick($event, $root)">
      <div style="height: 100%" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true" v-for="(item, index) in htmls" :key="index" v-show="htmls[index].show">
          <div style="height: 100%" v-html="item.html"></div>
      </div>
    </div>
  </div>
</template>
<script>
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import ScriptLoader from '@/common/ScriptLoader'
import StyleLoader from '@/common/StyleLoader'
import PopMenu from '@/components/Menu/PopMenu'
import { mapState } from 'vuex'
import bus from '../utils/Bus'
import { clearArgs, events } from '../../common/RendererService'
import { InternalCommand, commandService } from '@/common/CommandService'
import { config } from '@/../public/CivetConfig'
import Vue from 'vue'

export default {
  name: 'web-container',
  components: { PopMenu },
  data() {
    return {
      htmls: {},
      activateView: null,
      script: '',
      isUpdated: false,
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
    this.$events.on('civet', 'onSwitchView', this.onSwitchView)
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
          console.info('Overview update', this.$store.state.Cache.viewClass)
          // this.$events.emit('Overview', 'update', {
          //   'class': this.$store.state.Cache.viewClass,
          //   'resource': this.$store.state.Cache.viewItems
          // })
          this.$store.dispatch('getClassesAndFiles', '/')
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
  computed: mapState({
  }),
  async updated() {
    if (this.isUpdated) return
    try {
      await ScriptLoader.load(this.script)
    } catch (err) {
      console.error(`load ${this.activateView} javascript exception: ${err}`)
    }
    // console.info(value, 'menu is', menus)
    const menus = await this.$ipcRenderer.get(IPCNormalMessage.GET_OVERVIEW_MENUS, 'overview/' + this.activateView)
    console.info('updated', this.activateView)
    this.extensionMenus = []
    for (let menu of menus) {
      this.extensionMenus.push({
        id: this.activateView,
        name: menu.name,
        command: menu.command
      })
      if (this.isInternalCommand(menu.command)) {
        commandService.registInternalCommand(this.activateView, menu.command, this)
      } else {
        events.on(this.activateView, menu.command, function(args) {
          console.info('on event', menu.command)
          self.$ipcRenderer.send(IPCNormalMessage.POST_COMMAND, {target: this.activateView, command: 'ext:' + menu.command, args: args})
        })
      }
    }
    console.info('reply view menus', this.extensionMenus, menus)
    this.$store.dispatch('display')
    this.isUpdated = true
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
      console.info('init overview', this.activateView)
      if (this.activateView && this.activateView !== value.id) {
        this.htmls[this.activateView].show = false
      }
      if (this.htmls[value.id]) {
        this.htmls[value.id].show = true
        console.info('switch to', value.id)
      } else {
        StyleLoader.load(value.style)
        Vue.set(this.htmls, value.id, {html: value.body, show: true})
        console.info('new to', value.id)
      }
      this.activateView = value.id
      this.isUpdated = false
      this.script = value.script
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
    },
    onSwitchView(viewid) {
      console.info('switch view to', viewid)
      if (this.activateView && this.activateView !== viewid) {
        this.htmls[this.activateView].show = false
        this.htmls[viewid].show = true
      }
      this.activateView = viewid
    }
  }
}
</script>
<style scoped>
.webview {
  height: 100%;
}
</style>