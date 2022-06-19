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
import SandBoxManager from '@/common/JSSandBox'
import StyleLoader from '@/common/StyleLoader'
import HtmlLoader from '@/common/HtmlLoader'
import PopMenu from '@/components/Menu/PopMenu'
import { mapState } from 'vuex'
import bus from '../utils/Bus'
import { clearArgs, events, getCurrentViewName, updateCurrentViewName, getSelectionID } from '../../common/RendererService'
import { InternalCommand, commandService } from '@/common/CommandService'
import { config } from '@/../public/CivetConfig'
import { Shortcut } from '../../shortcut/Shortcut'
import Vue from 'vue'

export default {
  name: 'web-container',
  components: { PopMenu },
  data() {
    return {
      htmls: {},
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
  created() {
    console.info('web panel created')
    this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_ROUTER_UPDATE, this.onPanelRouterInit)
    this.$events.on('civet', 'onSwitchView', this.onSwitchView)
    console.info('web panel mounted', config.defaultView)
    updateCurrentViewName(config.defaultView)
    // this.$ipcRenderer.send(IPCNormalMessage.REQUEST_UPDATE_RESOURCES)
    this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_OVERVIEW, config.defaultView)
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '全部', cmd: 'display-all'})
  },
  mounted() {
    console.info('web panel mounted', config.defaultView)
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
          if (to.query.name === '全部') {
            this.$store.dispatch('getClassesAndFiles', '/')
          }
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-all'})
          break
        case '/uncategory':
          const view = getCurrentViewName()
          this.$store.dispatch('getUncategoryResources')
          // this.$events.emit('Overview:' + view, 'update', {resource: this.$store.state.Cache.viewItems})
          break
        case '/untag':
          // this.$events.emit('Overview:' + view, 'update', {resource: this.$store.state.Cache.viewItems})
          this.$store.dispatch('getUntagResources')
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
    const activateView = getCurrentViewName()
    try {
      await SandBoxManager.switchSandbox(activateView, this.script)
    } catch (err) {
      console.error(`load ${activateView} javascript exception: ${err}`)
      this.isUpdated = true
      return
    }
    this.$store.dispatch('display')
    await this.reinitMenu(activateView)
    await this.reinitKeybinding(activateView)
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
      event.preventDefault()
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
      let activateView = getCurrentViewName()
      console.info('init overview', activateView)
      if (activateView && activateView !== value.id) {
        this.htmls[activateView].show = false
        // HtmlLoader.outjector(activateView)
      }
      if (this.htmls[value.id]) {
        this.htmls[value.id].show = true
        console.info('switch to', value.id)
      } else {
        StyleLoader.load(value.style, value.id)
        Vue.set(this.htmls, value.id, {html: HtmlLoader.load(value.body, value.id), show: true})
        // Vue.set(this.htmls, value.id, {html: value.body, show: true})
        console.info('new to', value.id)
        this.isUpdated = false
      }
      updateCurrentViewName(value.id)
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
      if (getSelectionID() === undefined) return
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
      const currentView = getCurrentViewName()
      console.info('switch view to', viewid)
      if (currentView && currentView !== viewid) {
        this.htmls[currentView].show = false
        this.htmls[viewid].show = true
        SandBoxManager.switchSandbox(viewid)
      }
      updateCurrentViewName(viewid)
    },
    async reinitMenu(activateView) {
      const menus = await this.$ipcRenderer.get(IPCNormalMessage.GET_OVERVIEW_MENUS, 'overview/' + activateView)
      this.extensionMenus = []
      for (let menu of menus) {
        this.extensionMenus.push({
          id: activateView,
          name: menu.name,
          command: menu.command
        })
        if (this.isInternalCommand(menu.command)) {
          commandService.registInternalCommand(activateView, menu.command, this)
        } else {
          const self = this
          events.on(activateView, menu.command, function(args) {
            console.info('on event', menu.command)
            self.$ipcRenderer.send(IPCNormalMessage.POST_COMMAND, {target: activateView, command: 'ext:' + menu.command, args: args})
          })
        }
      }
      console.info('reply view menus', this.extensionMenus, menus)
    },
    async reinitKeybinding(activateView) {
      const activeName = 'overviewFocus.' + activateView
      const keybinds = await this.$ipcRenderer.get(IPCNormalMessage.GET_OVERVIEW_KEYBINDS, activeName)
      console.info(`init keybinds[${activeName}]: ${JSON.stringify(keybinds)}`)
      for (const keybind of keybinds) {
        const command = keybind.command
        if (!this.isInternalCommand(command)) {
          // command transmit to its view
          const transmit = (when) => {
            console.debug('transmit message to overview:', activateView)
            const currentView = getCurrentViewName()
            if (when === 'overviewFocus') {
              if (currentView === activateView) events.emit('Overview:' + activateView, command, getSelectionID())
            }
            return true
          }
          Shortcut.register(keybind.key, keybind.when, transmit)
        }
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