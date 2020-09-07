<template>
  <div class="image-panel">
      <JImage :src="image.path" ref="display"></JImage>
      <div>
        <button @click="onRoate90">Rotate90</button>
      </div>
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
  },
  methods: {
    onRoate90() {
      this.$refs.display.rotateClockwise()
    }
  }
}
</script>

<style scoped>
.image-panel{
  height: 85vh;
  text-align:center;
}
</style>