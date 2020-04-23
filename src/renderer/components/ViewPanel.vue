<template>
    <div id="main-content">
    <el-scrollbar style="height:95vh;">
        <div v-for="image in imageList" :key="image" class="image" @click="onImageClick(image)">
          <el-image :src="image.realpath" lazy class="preview"></el-image>
          <div class="name">{{image.label}}</div>
        </div>
      </el-scrollbar>
    </div>
</template>

<script>
import bus from './utils/Bus'

export default {
  name: 'view-panel',
  data() {
    return {
      urls: []
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
    onImageClick(image) {
      bus.emit(bus.EVENT_SELECT_IMAGE, image)
      // 单图片显示
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
  /* display: inline-block; */
  padding: 2px;
}
.preview {
  text-align: center;
}
.name {
  /* max-width: 19%; */
  text-overflow:ellipsis;
  white-space:nowrap;
  overflow: hidden;
}
</style>