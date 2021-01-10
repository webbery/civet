<template>
    <div id="main-content" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="menus" :underline="false" @ecmcb="onSelectMenu" tag="mainView"></PopMenu>
    <el-scrollbar style="height:96vh;" @click.native="onPanelClick($event)">
      <Waterfall :line-gap="200" :max-line-gap="700" :scrollReachBottom="onRequestNewData" :watch="imageList">
        <WaterfallSlot v-for="(item, index) in imageList" :width="item.width" :height="item.height" :order="index" :key="item.id">
          <div class="image" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true">
            <el-card :body-style="{ padding: '0px'}" shadow="never" style="border: 0px;">
              <Preview :src="getImage(item)" class="preview" 
                @dblclick.native="onImageDbClick(item)"
                @keydown.ctrl.67.native="onFileCopyOut(props)"
                @contextmenu.native="onImageClick($event, $root, item)" @mousedown.native="onImageClick($event, $root, item)" 
              >
              </Preview>
              <div style="padding: 2px;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;text-align: center;" @dblclick.native="onClickName(index)">
                <span class="name" >{{item.filename}}</span>
                <input v-if="enableInput"/>
              </div>
            </el-card>
          </div>
        </WaterfallSlot>
      </Waterfall>
      </el-scrollbar>
    </div>
</template>

<script>
import bus from '../utils/Bus'
import Service from '../utils/Service'
import Preview from '../Control/Preview'
import ImgTool from '../utils/ImgTool'
import PopMenu from '@/components/Menu/PopMenu'
import Global from '../utils/Global'
import { mapState } from 'vuex'
import PluginManager from '@/../public/PluginManager'
import Waterfall from '../Layout/waterfall'
import WaterfallSlot from '../Layout/waterfall-slot'

export default {
  name: 'view-panel',
  components: {
    Preview, PopMenu, Waterfall, WaterfallSlot
  },
  data() {
    return {
      firstLoad: true,
      lastSelections: {},
      enableInput: false,
      imageSelected: false,
      menus: [
        {text: '导出到计算机', cb: this.onChangeName},
        {text: '重命名', cb: this.onChangeName},
        {text: '删除', cb: this.onDeleteItem}
      ],
      width: 400,
      height: 800,
      testData: [{src: '111', href: '2222'}]
    }
  },
  async mounted() {
    console.info('mounted')
    // if (this.firstLoad === true) {
    //   this.firstLoad = false
    // bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '全部', cmd: 'display-all'})
    //   const snaps = this.$kernel.getFilesSnap(-1)
    //   console.info('View Panel', snaps)
    //   let imagesID = []
    //   for (let snap of snaps) {
    //     imagesID.push(snap.id)
    //   }
    //   const images = this.$kernel.getFilesInfo(imagesID)
    //   let list = []
    //   for (let image of images) {
    //     list.push(new FileBase(image))
    //     console.info(image)
    //   }
    //   this.imageList = list
    // }
    // bus.on(bus.EVENT_REMOVE_FILES, this.onRemoveFiles)
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '全部', cmd: 'display-all'})
    this.width = document.getElementById('main-content').offsetWidth
    this.height = document.getElementById('main-content').offsetHeight
    console.info('width: ', this.width, 'height:', this.height)
  },
  computed: mapState({
    imageList: (state) => state.Cache.viewItems
  }),
  watch: {
    $route: function(to, from) {
      console.info('to: ', to, 'from:', from.path)
      let name = to.query.name
      if (name === undefined) {
        name = '全部'
      }
      switch (to.path) {
        case '/':
          this.$store.dispatch('display')
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-all'})
          break
        case '/uncategory':
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
    onRequestNewData(item, itemIndex, groupIndex) {
      console.info('onRequestNewData', item)
      // item['x'] = (itemIndex % 2) * 110
      // item['y'] = parseInt(itemIndex / 2) * 160
      // const { data, ...sizeAndPosition } = item
      // return sizeAndPosition
      return this.imageList
    },
    onPanelClick(event) {
      console.info('onPanelClick')
      if (this.imageSelected) this.imageSelected = false
      else {
        this.clearSelections()
      }
    },
    onImageClick(e, root, image) {
      console.info('onImageClick', image)
      this.imageSelected = true
      if (!Global.ctrlPressed) {
        bus.emit(bus.EVENT_SELECT_IMAGE, image.id)
        if (e.button === 2) { // 选择多个后右键
          // right click
          this.imageSelected = false
          root.$emit('easyAxis', {
            tag: 'mainView',
            index: image.id,
            x: event.clientX,
            y: event.clientY
          })
        } else {
          // 框亮显示
          this.clearSelections()
          this.lastSelections[image.id] = e.target.parentNode
          e.target.parentNode.style.border = '2px solid red'
        }
      } else { // 多选
        this.lastSelections[image.id] = e.target.parentNode
        e.target.parentNode.style.border = '2px solid red'
      }
    },
    async onImageDbClick(image) {
      let imageInfo = await this.$ipcRenderer.get(Service.GET_IMAGE_INFO, image.id)
      if (imageInfo !== null) {
        imageInfo['id'] = image.id
        console.info('debug:', imageInfo)
        this.$router.push({name: 'view-image', params: imageInfo, query: {name: imageInfo.filename, cmd: 'display'}})
      }
    },
    onClickName: function (index) {
      console.info(index)
      this.enableInput = true
    },
    onSelectMenu: function (indexList) {
      console.info(indexList)
    },
    onFileCopyOut(image) {
      console.info('COPY')
      // console.info(__filename, __line, image)
    },
    onImageNameChange(image) {},
    dropFiles(event) {
      let files = event.dataTransfer.files
      let paths = []
      const String = require('../../../public/String').default
      const h = this.$createElement
      for (let item of files) {
        const fs = require('fs')
        const stat = fs.statSync(item.path)
        if (stat.isFile()) {
          const ext = String.getFormatType(item.path)
          if (PluginManager.getModuleByExt(ext) === null) {
            this.$notify.error({
              title: '不支持的格式',
              dangerouslyUseHTMLString: true,
              message: h('div', {style: 'color: white; font-size: 12px;'}, item.path),
              // duration: 0,
              position: 'bottom_right'
            })
            continue
          }
        } else if (!stat.isDirectory()) {
          continue
        }
        paths.push(item.path)
      }
      if (paths.length > 0) {
        this.$ipcRenderer.send(Service.ADD_IMAGES_BY_PATHS, paths)
      }
    },
    dragStart(event) {
      event.target.style.opacity = '0.5'
      const fileisID = Object.keys(this.lastSelections)
      console.info('drag start', fileisID)
      event.dataTransfer.setData('civet', JSON.stringify(fileisID))
      // event.dataTransfer.setData('application/octet-stream', 'file://F:/Image/N1NtaWlwTDRsa0xTbnpiNjlOVTVLbjNGTDR0NGRDTk9QcVl3YjVnanEvL3NlQmRaREpIbjlnPT0.jpg')
      // event.dataTransfer.effectAllowed = 'copy'
    },
    dragEnd(event) {
      console.info('dragEnd', event.dataTransfer)
      event.target.style.opacity = ''
      event.preventDefault()
      // event.stopPropagation()
      // const url = event.dataTransfer.getData('text/plain')
      // console.info('copy URI:', url)
    },
    onRemoveFiles(removeIDs) {
      for (let id of removeIDs) {
        const index = this.imageList.findIndex((image) => { return image.id === id })
        if (index !== -1) {
          this.imageList.splice(index, 1)
        }
      }
    },
    onDeleteItem(name, parent, fileid) {
      this.onRemoveFiles([fileid])
      bus.emit(Service.EVENT_REMOVE_ITEM, [fileid])
      this.$ipcRenderer.send(Service.REMOVE_FILES, [fileid])
    },
    onFileLoad() {
      console.info('on file load')
    },
    getImage(image) {
      console.info('getImage:', image)
      return ImgTool.getSrc(image)
    },
    clearSelections() {
      for (const k in this.lastSelections) {
        this.lastSelections[k].style.border = '2px solid white'
      }
      this.lastSelections = {}
    }
  }
}
</script>

<style scoped>
.time {
  font-size: 13px;
  color: #999;
}

.bottom {
  /* float: left; */
  position: absolute;
  bottom: 22px;
  right: 0px;
  z-index: 9;
}
.image {
  margin: 0 6px 0 0;
}

.clearfix:before,
.clearfix:after {
    display: table;
    content: "";
}

.clearfix:after {
    clear: both
}
.preview {
  border:3px solid white;
  text-align: center;
}
.preview .image-top {
  display: none !important;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
}
.preview:hover .image-top {
  display: inline;
}
.name {
  font-size: 12px;
}
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  padding-top: 100px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
}
.detail{
  display: none;
}
</style>