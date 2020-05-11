<template>
  <div>
    <el-scrollbar style="height:96vh;">
      <el-card :body-style="{ padding: '0px' }">
        <el-image :src="image.path" lazy class="preview" @click="onImageClick($event, image)"/>
      </el-card>
    </el-scrollbar>
  </div>
</template>

<script>
import bus from './utils/Bus'
export default {
  name: 'image-panel',
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