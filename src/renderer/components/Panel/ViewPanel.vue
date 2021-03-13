<template>
  <div v-if="imageList.length === 0" @drop="dropFiles($event)" @dragover.prevent>
    <div @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true" style="height:96vh;widht: 100%">
      <div class="initial" @click="onLoadFilesTest">
        请拖拽文件或文件夹到此处
      </div>
    </div>
  </div>
  <div v-else> 
    <div id="main-content" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="menus" :underline="false" @ecmcb="onSelectMenu" tag="mainView"></PopMenu>
    <el-scrollbar style="height:96vh;" @click.native="onPanelClick($event)" wrap-style="overflow-x:hidden;">
      <div v-if="classList.length > 0">
        <div class="hr-divider" data-content="分类"></div>
        <div v-bind:class="{'folder-selected': folderSelected[idx], 'folder': !folderSelected[idx]}"
          v-for="(item, idx) in classList" :key="idx"
          @click="onClassClick($event, idx, item)"
          @dblclick="onClassDbClick($event, idx, item)"
        >
          <div class="b-icon b-icon_type_folder"></div>
          <div>{{ item.name }}</div>
        </div>
        <div class="hr-divider" data-content="文件"></div>
      </div>
      <Waterfall :line-gap="200" :max-line-gap="700" :scrollReachBottom="onRequestNewData" :watch="imageList">
        <WaterfallSlot v-for="(item, index) in imageList" :width="item.width" :height="item.height" :order="index" :key="item.id">
          <div class="image" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true">
            <el-card :body-style="{ padding: '1px'}" shadow="never" style="border: 0px;">
              <Preview :src="getImage(item)"
                @dblclick.native="onImageDbClick(item)"
                @keydown.ctrl.67.native="onFileCopyOut(props)"
                @contextmenu.native="onImageClick($event, $root, item)"
                @mousedown.native="onImageClick($event, $root, item)"
              >
              </Preview>
              <div style="padding: 2px;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;text-align: center; font-size: 12px;">
                <InputLabel @changed="onFilenameChanged" :fileid="item.id" 
                >{{item.filename}}</InputLabel>
              </div>
            </el-card>
          </div>
        </WaterfallSlot>
      </Waterfall>
      </el-scrollbar>
    </div>
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
// import ExtensionManager from '@/../public/ExtensionManager'
import Waterfall from '../Layout/waterfall'
import WaterfallSlot from '../Layout/waterfall-slot'
import InputLabel from '../Control/InputLabel'

export default {
  name: 'view-panel',
  components: {
    Preview, PopMenu, Waterfall, WaterfallSlot, InputLabel
  },
  data() {
    return {
      firstLoad: true,
      lastSelections: {},
      imageSelected: false,
      menus: [
        {text: '导出到计算机', cb: this.onExportFiles},
        // {text: '重命名', cb: this.onChangeName},
        {text: '删除', cb: this.onDeleteItem}
      ],
      // width: 400,
      // height: 800,
      testData: [{src: '111', href: '2222'}],
      lastSelectFolder: -1,
      folderSelected: []
    }
  },
  mounted() {
    console.info('mounted')
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '全部', cmd: 'display-all'})
    // this.width = document.getElementById('main-content').offsetWidth
    // this.height = document.getElementById('main-content').offsetHeight
    // console.info('width: ', this.width, 'height:', this.height)
  },
  computed: mapState({
    imageList: (state) => state.Cache.viewItems,
    classList(state) {
      if (this.lastSelectFolder === -1) {
        this.folderSelected.splice(0, this.folderSelected.length)
        for (let idx = 0; idx < state.Cache.viewClass.length; ++idx) {
          this.$set(this.folderSelected, idx, false)
        }
      }
      return state.Cache.viewClass
    }
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
      this.$set(this.folderSelected, this.lastSelectFolder, false)
      this.lastSelectFolder = -1
    },
    onImageClick(e, root, image) {
      console.info('onImageClick', e, image)
      this.imageSelected = true
      if (!Global.ctrlPressed) {
        bus.emit(bus.EVENT_SELECT_IMAGE, image.id)
        if (event.button === 2) { // 选择多个后右键
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
          e.target.parentNode.style.border = '1px solid red'
        }
      } else { // 多选
        this.lastSelections[image.id] = e.target.parentNode
        e.target.parentNode.style.border = '1px solid red'
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
    onFilenameChanged: function (fileid, newname) {
      console.info(fileid, newname)
      this.$store.dispatch('changeFileName', {id: fileid, filename: newname})
      if (this.imageSelected) {
        this.$nextTick(() => {
          bus.emit(bus.EVENT_SELECT_IMAGE, fileid)
        })
      }
    },
    onClassClick: function (event, idx, item) {
      console.info('folder click', idx, item, this.lastSelectFolder)
      event.stopPropagation()
      if (this.lastSelectFolder !== -1) {
        this.$set(this.folderSelected, this.lastSelectFolder, false)
      }
      this.$set(this.folderSelected, idx, true)
      this.lastSelectFolder = idx
    },
    onClassDbClick: function (event, idx, item) {
      this.$store.dispatch('getClassesAndFiles', item.path)
      this.lastSelectFolder = -1
    },
    onSelectMenu: function (indexList) {
      console.info(indexList)
    },
    onFileCopyOut(image) {
      console.info('COPY')
      // console.info(__filename, __line, image)
    },
    dropFiles(event) {
      let files = event.dataTransfer.files
      let paths = []
      // const String = require('../../../public/String').default
      for (let item of files) {
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
      console.info('dragEnd from view', event.dataTransfer)
      event.target.style.opacity = ''
      event.preventDefault()
      // event.stopPropagation()
      // const url = event.dataTransfer.getData('text/plain')
      // console.info('copy URI:', url)
    },
    onDeleteItem(name, parent, fileid) {
      // this.onRemoveFiles([fileid])
      // bus.emit(Service.EVENT_REMOVE_ITEM, [fileid])
      // this.$ipcRenderer.send(Service.REMOVE_FILES, [fileid])
      this.$store.dispatch('removeFiles', [fileid])
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
        this.lastSelections[k].style.border = '0'
      }
      this.lastSelections = {}
    },
    onExportFiles(name, parent, fileid) {
      console.info(fileid, 'selections:', this.lastSelections)
      const filesID = Object.keys(this.lastSelections)
      const files = this.$store.getters.getFiles(filesID)
      let filespath = []
      for (let file of files) {
        filespath.push(file.path)
      }
      const ipcRenderer = require('electron').ipcRenderer
      ipcRenderer.send('export2Diectory', filespath)
    },
    onScrollNearBottom() {},
    onLoadFilesTest() {
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
  /* border:3px solid white; */
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
.b-icon {
    font-size: 32px;
}
.b-icon_type_folder {
    display: inline-block;
    margin: 0em 1em 0 1em;
    background-color: transparent;
    overflow: hidden;
}
.b-icon_type_folder:before {
    content: '';
    float: left;
    background-color: #7b88ad;
    width: 1.5em;
    height: 0.45em;
    margin-left: 0.07em;
    margin-bottom: -0.07em;
    border-top-left-radius: 0.1em;
    border-top-right-radius: 0.1em;
    box-shadow: 1.25em 0.25em 0 0em #7ba1ad;
}
.b-icon_type_folder:after {
    content: '';
    float: left;
    clear: left;
    background-color: #a0d4e4;
    width: 3em;
    height: 2.25em;
    border-radius: 0.1em;
}
.folder {
  display: inline-block;
  text-align: center;
  font-size: 14px;
}
.folder-selected {
  display: inline-block;
  background-color: rgb(27, 128, 230);
  /* margin: 0em 1em 0 1em; */
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}
.hr-divider {
    line-height: 1em;
    position: relative;
    outline: 0;
    border: 0;
    text-align: center;
    height: 1.5em;
    opacity: 0.5;
}
.hr-divider:before {
    content: '';
    background: -webkit-linear-gradient(left, transparent, white, transparent);
    background: linear-gradient(to right, transparent, white, transparent);
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
}
.hr-divider:after {
    content: attr(data-content);
    position: relative;
    display: inline-block;
    padding: 0 0.5em;
    line-height: 1.5em;
    color: white;
    background-color: #222933;
}
.initial {
  width:350px;
	height:150px;
	position:fixed;
	top:50%;
  font-size: 25px;
	margin-top:-25px;
  left: 40%;
}
</style>