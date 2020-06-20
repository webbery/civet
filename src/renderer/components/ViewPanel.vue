<template>
    <div id="main-content" @drop="dropFiles($event)" @dragover.prevent>
    <el-scrollbar style="height:96vh;">
        <div v-for="(image,idx) in imageList" :key="idx" class="image" @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true">
          <el-card :body-style="{ padding: '0px' }" style="position: relative" >
            <!-- <div class="bottom clearfix">
              <el-button type="text" class="button" icon="el-icon-zoom-in"></el-button>
            </div> -->
          <JImage :src="getImage(image)" :interact="false" class="preview" @click.native="onImageClick($event, image)" @dblclick.native="onImageDbClick(image)">
          </JImage>
          <div style="padding: 14px;">
            <span class="name">{{image.label}}</span>
          </div>
        </el-card>
        </div>
        
      </el-scrollbar>
    </div>
</template>

<script>
import bus from './utils/Bus'
import Service from './utils/Service'
import JImage from './JImage'
import ImgTool from './utils/ImgTool'

export default {
  name: 'view-panel',
  components: {
    JImage
  },
  data() {
    return {
      firstLoad: true,
      lastSelection: null
    }
  },
  async mounted() {
    console.info('mounted')
    if (this.firstLoad === true) {
      this.firstLoad = false
      bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '全部', cmd: 'display-all'})
    }
  },
  computed: {
    imageList() {
      // console.info('+++++++++', this.$store.state.Picture.imageList)
      // if (this.$store.state.Picture.imageList.length > 80) {
      //   return this.$store.state.Picture.imageList.slice(0, 79)
      // }
      return this.$store.state.Picture.imageList
    }
  },
  watch: {
    $route: async function(to, from) {
      console.info('to: ', to, 'from:', from.path)
      let name = to.query.name
      if (name === undefined) {
        name = '全部'
      }
      switch (to.path) {
        case '/':
          let images = await this.$ipcRenderer.get(Service.GET_IMAGES_INFO)
          console.info('all images:', images)
          this.$store.dispatch('updateImageList', images)
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: name, cmd: 'display-all'})
          break
        case '/uncategory':
          break
        default:
          break
      }
    }
  },
  methods: {
    async onImageClick(e, image) {
      // console.info(this.$chilidren)
      bus.emit(bus.EVENT_SELECT_IMAGE, image.id)

      // 框亮显示
      if (this.lastSelection !== null) {
        this.lastSelection.style.border = '3px solid white'
      }
      e.target.parentNode.style.border = '3px solid red'
      this.lastSelection = e.target.parentNode
    },
    async onImageDbClick(image) {
      let imageInfo = await this.$ipcRenderer.get(Service.GET_IMAGE_INFO, image.id)
      if (imageInfo !== null) {
        imageInfo['id'] = image.id
        console.info('debug:', imageInfo)
        this.$router.push({name: 'view-image', params: imageInfo, query: {name: imageInfo.label}})
      }
    },
    dropFiles(event) {
      let files = event.dataTransfer.files
      let paths = []
      for (let item of files) {
        paths.push(item.path)
      }
      if (paths.length > 0) {
        this.$ipcRenderer.send(Service.ADD_IMAGES_BY_PATHS, paths)
      }
    },
    dragStart(event) {
      console.info('drag start')
      event.dataTransfer.setData('my-info', 'file://F:/Image/N1NtaWlwTDRsa0xTbnpiNjlOVTVLbjNGTDR0NGRDTk9QcVl3YjVnanEvL3NlQmRaREpIbjlnPT0.jpg')
      // event.dataTransfer.setData('application/octet-stream', 'file://F:/Image/N1NtaWlwTDRsa0xTbnpiNjlOVTVLbjNGTDR0NGRDTk9QcVl3YjVnanEvL3NlQmRaREpIbjlnPT0.jpg')
      // event.dataTransfer.effectAllowed = 'copy'
    },
    dragEnd(event) {
      console.info('dragEnd', event.dataTransfer)
      // event.preventDefault()
      // event.stopPropagation()
      const url = event.dataTransfer.getData('my-info')
      console.info('copy URI:', url)
    },
    onUpdateImages(updateImages) {
      // for (let item of updateImages) {
      //   images.push(item.realpath)
      // }
    },
    getImage(image) {
      return ImgTool.getSrc(image)
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
  max-width: 19%;
  margin: 0 0 0 6px;
  display: inline-block;
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
  /* max-width: 19%; */
  text-overflow:ellipsis;
  white-space:nowrap;
  overflow: hidden;
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