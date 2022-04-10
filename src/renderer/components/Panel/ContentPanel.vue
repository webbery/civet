<template>
      <el-main style="height: 100%">
        <el-scrollbar style="height: 93vh;" wrap-style="overflow-x:hidden;">
        <div class="image-panel">
          <div class="__cv_prev" @click="onClickPrev"></div>
          <!-- <div v-if="!isParsed">
            <div class="_cv_content_loading">
              <svg class="_cv_circular" viewBox="25 25 50 50">
                <circle class="_cv_path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>
              </svg>
            </div>
          </div>
          <div v-else style="height: 100%"> -->
            <div style="height: 100%" v-html="html" id="_cv_content_view"></div>
          <!-- </div> -->
          <div class="__cv_next" @click="onClickNext"></div>
        </div>
        </el-scrollbar>
      </el-main>
</template>

<script>
import bus from '../utils/Bus'
import { mapState } from 'vuex'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import { civetApi, events, getContentViewName, updateContentViewName } from '../../common/RendererService'
// import ScriptLoader from '@/common/ScriptLoader'
import StyleLoader from '@/common/StyleLoader'
import HtmlLoader from '@/common/HtmlLoader'
import SandBoxManager from '@/common/JSSandBox'
import path from 'path'

export default {
  name: 'image-panel',
  data() {
    return {
      resource: null,
      index: 0,
      viewer: null,
      html: '',
      script: '',
      isUpdated: false,
      isParsed: false
    }
  },
  computed: mapState({
    candidates: state => state.Cache.viewItems
  }),
  mounted() {
    this.resource = this.$route.params
    console.info('content panel mounted:', this.resource, this.candidates)
    if (this.resource.type) {
      this.$ipcRenderer.on(IPCRendererResponse.ON_EXTENSION_CONTENT_UPDATE, this.onContentViewUpdate)
      this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_CONTENT_VIEW, this.resource.type)
      bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '资源', cmd: 'display'})
      for (let idx = 0; idx < this.candidates.length; ++idx) {
        if (this.candidates[idx].id === this.resource.id) {
          this.index = idx
          break
        }
      }
    } else {
      // unkonw file type
    }
    this.$nextTick(() => {
      bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.resource.filename || this.resource.name)
    })
  },
  watch: {
    $route: function(to, from) {
      console.info('content panel, to: ', to, 'from:', from.path)
    }
  },
  async updated() {
    if (this.isUpdated) return
    const contentView = getContentViewName()
    try {
      // await ScriptLoader.load(this.script)
      await SandBoxManager.switchSandbox(contentView, this.script)
    } catch (err) {
      console.error(`load ${contentView} javascript exception: ${err}`)
      this.html = JSON.stringify(err)
      this.isUpdated = true
      return
    }
    events.emit('ContentView:' + contentView, 'load', path.normalize(this.candidates[this.index].path))
    this.isUpdated = true
  },
  methods: {
    showContent(index) {
      bus.emit(bus.EVENT_DISPLAY_FILE_NAME, this.candidates[index].filename)
      const contentView = getContentViewName()
      events.emit('ContentView:' + contentView, 'load', path.normalize(this.candidates[index].path))
      const id = this.candidates[index].id
      civetApi().Overview.click(id)
      // this.$ipcRenderer.send(IPCNormalMessage.GET_SELECT_CONTENT_ITEM_INFO, {id: [id]})
    },
    onClickNext() {
      console.info(`next image: ${this.index}, total: ${this.candidates.length}`)
      if (this.index > this.candidates.length) {
        this.index = this.candidates.length
        return
      }
      this.index += 1
      if (this.candidates[this.index].type !== this.resource.type) {
        this.resource = this.candidates[this.index]
        this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_CONTENT_VIEW, this.resource.type)
      }
      this.$nextTick(() => {
        this.showContent(this.index)
      })
    },
    onClickPrev() {
      console.info(`prev image: ${this.index}, total: ${this.candidates.length}`)
      if (this.index < 0) {
        this.index = 0
        return
      }
      this.index -= 1
      if (this.candidates[this.index].type !== this.resource.type) {
        this.resource = this.candidates[this.index]
        this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_CONTENT_VIEW, this.resource.type)
      }
      this.$nextTick(() => {
        this.showContent(this.index)
      })
    },
    onContentViewUpdate(session, value) {
      console.debug('onContentViewUpdate:', value)
      updateContentViewName(value.id)
      StyleLoader.load(value.style, value.id)
      this.html = HtmlLoader.load(value.body)
      this.script = value.script
      this.isUpdated = false
      this.isParsed = true
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

.__cv_prev{
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
.__cv_prev::before{
  top: 16px;
  left: 16px;
  position: absolute;
  content: "\E600";
}
.next:hover
.__cv_prev:hover {
	opacity:0.9;
}
.__cv_next {
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
.__cv_next::before{
  top: 16px;
  left: 16px;
  position: absolute;
  content: "\E604";
}

</style>