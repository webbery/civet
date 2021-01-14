<template>
  <div class="image-panel">
    <div class="prev"></div>
    <div class="next"></div>
    <img :src="image.path" id="file-viewer">
  </div>
</template>

<script>
import Viewer from 'viewerjs'
import bus from './utils/Bus'

export default {
  name: 'image-panel',
  data() {
    return {
      image: null,
      viewer: null
    }
  },
  created() {
    console.info('000', this.$route.params)
    this.image = this.$route.params
  },
  mounted() {
    this.image = this.$route.params
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '图片显示', cmd: 'display'})
    if (!this.viewer) {
      this.viewer = new Viewer(document.getElementById('file-viewer'), {
        toolbar: 1,
        zoomable: true,
        rotatable: true,
        viewed() {
          this.viewer.zoomTo(1)
        }
      })
    }
    bus.on(bus.EVENT_SCALE_IMAGE, this.scaleImage)
    bus.on(bus.EVENT_ROTATE_IMAGE, this.rotateImage)
  },
  methods: {
    scaleImage: (scale) => {},
    rotateImage: (angle) => {}
  }
}
</script>

<style scoped>
.image-panel{
  height: 85vh;
  text-align:center;
  align-items:center;
}
.prev{
  width: 25px;
  height: 40px;
  background: darkslateblue;
  line-height: 40px;
  font-family: 'element-icons' !important;
  float: left;
  position: absolute;
  top: 40%;
}
.prev::before{
  content: "\E600";
}
.next {
  /* position: fixed; */
  top: 50%;
  height: 50%;
  -webkit-transform: translateY(-50%);
  width: 25px;
  height: 40px;
  background: darkslateblue;
  line-height: 40px;
  font-family: 'element-icons' !important;
  margin-left:auto;
  margin-right: 0;
  position:relative;
}
.next::before{
  content: "\E604";
}
</style>