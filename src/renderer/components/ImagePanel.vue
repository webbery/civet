<template>
  <div class="image-panel">
      <JImage :src="image.path"></JImage>
      <!-- <el-card :body-style="{ padding: '0px' }">
        <el-image :src="image.path" lazy class="preview" @click="onImageClick($event, image)"/>
      </el-card> -->
  </div>
</template>

<script>
import bus from './utils/Bus'
import JImage from './JImage'

export default {
  name: 'image-panel',
  components: { JImage },
  data() {
    return {
      image: null
    }
  },
  created() {
    console.info('000', this.$route.params)
    this.image = this.$route.params
  },
  mounted() {
    this.image = this.$route.params
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '图片显示', cmd: 'display'})
  }
}
</script>

<style scoped>
.image-panel{
  height: 85vh;
  text-align:center;
}
</style>