<template>
  <div>
      <span class="el-icon-zoom-out"></span>
      <span class="el-icon-zoom-in"></span>
      <span class="el-icon-refresh-right"></span>
      <span class="el-icon-refresh-left"></span>
  </div>
</template>
<script>
import bus from './utils/Bus'

export default {
  name: 'image-operator',
  data() {
    return {
      scaleValue: 50
    }
  },
  methods: {
    scaleChange() {
      // 0.2~2
      bus.emit(bus.EVENT_SCALE_IMAGE, this.scaleValue * 1.8 / 100 + 0.2)
    }
  }
}
</script>

<style scoped>

</style>