<template>
      <el-main style="height: 100%">
        <el-scrollbar style="height: 93vh;" wrap-style="overflow-x:hidden;">
        <div class="image-panel">
          <div class="prev" @click="onClickPrev"></div>
          <!-- <div class="viewer">
            <img :src="candidates[index].path">
          </div> -->
          <div style="height: 100%" v-html="html"></div>
          <div class="next" @click="onClickNext"></div>
        </div>
        </el-scrollbar>
      </el-main>
</template>

<script>
import bus from '../utils/Bus'
import { mapState } from 'vuex'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'

export default {
  name: 'image-panel',
  data() {
    return {
      resource: null,
      index: 0,
      viewer: null,
      html: ''
    }
  },
  computed: mapState({
    candidates: state => state.Cache.viewItems
  }),
  mounted() {
    this.html = '<div class="_cv_content_loading"><svg class="_cv_circular" viewBox="25 25 50 50">' +
      '<circle class="_cv_path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>' +
      '</svg></div>'
    this.resource = this.$route.params
    console.info('content panel mounted:', this.resource, this.candidates)
    if (this.resource.type) {
      this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_CONTENT_UPDATE, this.onContentViewUpdate)
      this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_CONTENT_VIEW, this.resource.type)
      bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '图片显示', cmd: 'display'})
      // for (let idx = 0; idx < this.candidates.length; ++idx) {
      //   if (this.candidates[idx].id === this.image.id) {
      //     this.index = idx
      //     this.$nextTick(() => {
      //       bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.candidates[idx].filename)
      //     })
      //     break
      //   }
      // }
    } else {
      // unkonw file type
    }
  },
  methods: {
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
    },
    onContentViewUpdate(session, value) {
      console.debug('onContentViewUpdate:', value)
      this.html = value.body
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
  /* display: flex; */
  /* align-items: center; */
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