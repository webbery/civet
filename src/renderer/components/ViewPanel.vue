<template>
    <div id="main-content">
    <el-scrollbar style="height:96vh;">
        <div v-for="(image,idx) in imageList" :key="idx" class="image" >
          <el-image :src="image.realpath" lazy class="preview" @click="onImageClick($event, image)"></el-image>
          <div class="name">{{image.label}}</div>
        </div>
      </el-scrollbar>
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

.image {
  max-width: 19%;
  display: inline-block;
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
</style>