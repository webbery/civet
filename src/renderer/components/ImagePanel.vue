<template>
  <div class="image-panel">
    <div class="prev" @click="onClickPrev"></div>
    <div class="viewer">
      <img :src="candidates[index].path" id="file-viewer">
    </div>
    <div class="next" @click="onClickNext"></div>
  </div>
</template>

<script>
import Viewer from 'viewerjs'
import bus from './utils/Bus'
import { mapState } from 'vuex'

export default {
  name: 'image-panel',
  data() {
    return {
      image: null,
      index: 0,
      viewer: null
    }
  },
  created() {
    console.info('000', this.$route.params)
    this.image = this.$route.params
  },
  computed: mapState({
    candidates: state => state.Cache.viewItems
  }),
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
    scaleImage: (scale) => {
      console.info('scale image: ', scale)
      this.viewer.zoomTo(scale)
    },
    rotateImage: (angle) => {
      console.info('rotate image: ', angle)
    },
    onClickNext() {
      console.info('next image')
      this.index += 1
      this.viewer.view(this.index)
    },
    onClickPrev() {
      console.info('prev image')
      this.index -= 1
      if (this.index < 0) return
      this.viewer.view(this.index)
    }
  }
}
</script>

<style scoped>
.image-panel{
  /* height: 100%; */
  /* height: 90vh; */
  /* background-repeat: no-repeat;
  background-size: contain;
  background-position: center; */
  /* background-color: rgb(59, 58, 58); */
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewer{
  display: table-cell;
  vertical-align: middle;
}
#file-viewer {
  max-width: 100%;
  max-height: 80%;
  display: block;
  margin-left:auto;
  margin-right:auto;
}
.prev{
  width: 25px;
  height: 40px;
  background: darkslateblue;
  line-height: 40px;
  font-family: 'element-icons' !important;
  float: left;
  /* position: fixed; */
  /* top: 40%; */
}
.prev::before{
  content: "\E600";
}
.next {
  /* position: fixed; */
  /* top: 50%; */
  /* height: 50%; */
  /* -webkit-transform: translateY(-50%); */
  width: 25px;
  height: 40px;
  background: darkslateblue;
  line-height: 40px;
  font-family: 'element-icons' !important;
  float: right;
}
.next::before{
  content: "\E604";
}
</style>