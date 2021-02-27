<template>
      <el-main style="height: 100%">
        <el-scrollbar style="height: 93vh;" wrap-style="overflow-x:hidden;">
        <div class="image-panel">
          <div class="prev" @click="onClickPrev"></div>
          <div class="viewer">
            <img :src="candidates[index].path">
          </div>
          <div class="next" @click="onClickNext"></div>
        </div>
        </el-scrollbar>
      </el-main>
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
  /* background-repeat: no-repeat;
  background-size: contain;
  background-position: center; */
  /* background-color: rgb(59, 58, 58); */
  display: flex;
  align-items: center;
  /* align-items:baseline; */
  /* flex-wrap:wrap; */
  justify-content: center;
  height: 100%;
}
.viewer{
  margin:auto;
  align-self: center;
  /* display: table-cell; */
  /* vertical-align: middle; */
}
.viewer img {
  width: 100%;
}
.prev{
  width:50px;
	height:50px;
	position:fixed;
	top:50%;
	margin-top:-25px;
	cursor:pointer;
	opacity:0.7;
	z-index:999999;
	-moz-box-shadow:0px 0px 3px #000;
	-webkit-box-shadow:0px 0px 3px #000;
	box-shadow:0px 0px 3px #000;
	-moz-border-radius:25px;
	-webkit-border-radius:25px;
	border-radius:25px;
  font-family: 'element-icons' !important;
  left: 18.5%;
}
.prev::before{
  top: 16px;
  left: 16px;
  position: absolute;
  content: "\E600";
}
.next:hover
.prev:hover {
	opacity:0.9;
}
.next {
  width:50px;
	height:50px;
	position:fixed;
	top:50%;
	margin-top:-25px;
	cursor:pointer;
	opacity:0.7;
	z-index:999999;
	-moz-box-shadow:0px 0px 3px #000;
	-webkit-box-shadow:0px 0px 3px #000;
	box-shadow:0px 0px 3px #000;
	-moz-border-radius:25px;
	-webkit-border-radius:25px;
	border-radius:25px;
  font-family: 'element-icons' !important;
  right: 18.5%;
}
.next::before{
  top: 16px;
  left: 16px;
  position: absolute;
  content: "\E604";
}
</style>