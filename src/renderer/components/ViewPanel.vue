<template>
    <div id="main-content">
    <el-scrollbar style="height:96vh;">
        <div v-for="(image,idx) in imageList" :key="idx" class="image" >
          <el-card :body-style="{ padding: '0px' }" style="position: relative">
            <div class="bottom clearfix">
              <el-button type="text" class="button" icon="el-icon-zoom-in"></el-button>
            </div>
          <el-image :src="image.src?image.realpath:('data:image/jpg;base64,'+image.src)" lazy class="preview" @click="onImageClick($event, image)">
          </el-image>
          <div style="padding: 14px;">
            <span class="name">{{image.label}}</span>
          </div>
        </el-card>
        </div>
        
      </el-scrollbar>
      <div class="detail">

      </div>
    </div>
</template>

<script>
import bus from './utils/Bus'
// import detection from './utils/Detection'
// import getPixes from 'get-pixels'

export default {
  name: 'view-panel',
  data() {
    return {
      lastSelection: null
    }
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_DISPLAY_IMAGE, this.onUpdateImages)
  },
  computed: {
    imageList() {
      return this.$store.state.Picture.imageList
    }
  },
  methods: {
    async onImageClick(e, image) {
      // 测试目标检测
      // getPixes('E:/code/nodejs/civet/eagle.jpg', async function(err, pixels) {
      //   if (err) {
      //     console.info(err)
      //     return
      //   }
      //   console.info(pixels)
      //   const prediction = await detection.predict(pixels)
      //   image.tags = prediction
      // })
      bus.emit(bus.EVENT_SELECT_IMAGE, image)
      // 框亮显示
      if (this.lastSelection !== null) {
        this.lastSelection.style.border = '3px solid white'
      }
      e.target.parentNode.style.border = '3px solid red'
      this.lastSelection = e.target.parentNode
    },
    onUpdateImages(updateImages) {
      // for (let item of updateImages) {
      //   images.push(item.realpath)
      // }
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