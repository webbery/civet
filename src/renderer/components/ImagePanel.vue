<template>
    <el-container>
      <el-main>
        <div class="image-panel">
          <div class="prev" @click="onClickPrev"></div>
          <div class="viewer">
            <img :src="candidates[index].path">
          </div>
          <div class="next" @click="onClickNext"></div>
        </div>
      </el-main>
      <el-footer>
        <span class="el-icon-zoom-out"></span>
        <span class="el-icon-zoom-in"></span>
      </el-footer>
    </el-container>
  
</template>

<script>
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
  computed: mapState({
    candidates: state => state.Cache.viewItems
  }),
  mounted() {
    console.info('candidates:', this.candidates)
    this.image = this.$route.params
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '图片显示', cmd: 'display'})
    bus.on(bus.EVENT_SCALE_IMAGE, this.scaleImage)
    bus.on(bus.EVENT_ROTATE_IMAGE, this.rotateImage)
    for (let idx = 0; idx < this.candidates.length; ++idx) {
      if (this.candidates[idx].id === this.image.id) {
        this.index = idx
        this.$nextTick(() => {
          bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.candidates[idx].filename)
        })
        break
      }
    }
  },
  methods: {
    scaleImage: (scale) => {
      console.info('scale image: ', scale)
    },
    rotateImage: (angle) => {
      console.info('rotate image: ', angle)
    },
    onClickNext() {
      console.info('next image')
      if (this.index > this.candidates.length) {
        this.index = this.candidates.length
        return
      }
      this.index += 1
      bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.candidates[this.index].filename)
      bus.emit(bus.EVENT_SELECT_IMAGE, this.candidates[this.index].id)
    },
    onClickPrev() {
      console.info('prev image')
      if (this.index < 0) {
        this.index = 0
        return
      }
      this.index -= 1
      bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.candidates[this.index].filename)
      bus.emit(bus.EVENT_SELECT_IMAGE, this.candidates[this.index].id)
    }
  }
}
</script>

<style scoped>
.image-panel{
  /* height: 100%; */
  height: 90vh;
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