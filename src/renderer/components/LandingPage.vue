<template>
  <el-container class="custom">
    <el-header>
      <HeaderBar></HeaderBar>
    </el-header>
    <el-row type="flex" class="row-bg">
      <el-col :span="4" class="nav-light">
        <TabMenu>
          <template v-slot:navigation>
            <NavigationPanel></NavigationPanel>
          </template>
          <template v-slot:extension>
            <ExtensionPanel></ExtensionPanel>
          </template>
        </TabMenu>
      </el-col>
      <el-col :span="16">
        <div class="display">
          <div id="loading-progress" v-if="loadProgress < 100"></div>
          <keep-alive>
          <router-view></router-view>
          </keep-alive>
        </div>
      </el-col>
      <el-col :span="4" class="nav-light">
        <PropertyPanel></PropertyPanel>
      </el-col>
    </el-row>
  </el-container>
</template>

<script>
import HeaderBar from '@/components/HeaderBar'
import TabMenu from '@/components/Menu/NaviMenu'
import NavigationPanel from '@/components/Panel/NavigationPanel'
import ExtensionPanel from '@/components/Panel/ExtensionPanel'
// import ViewPanel from '@/components/Panel/ViewPanel'
import WebPanel from '@/components/Panel/WebPanel'
import PropertyPanel from '@/components/Panel/PropertyPanel'
import TagPanel from '@/components/Panel/TagPanel'
import ConfigPanel from '@/components/Panel/ConfigPanel'
import Global from '@/components/utils/Global'

export default {
  name: 'landing-page',
  components: {
    HeaderBar,
    TabMenu,
    NavigationPanel,
    ExtensionPanel,
    // ViewPanel,
    WebPanel,
    PropertyPanel,
    TagPanel,
    ConfigPanel
  },
  data() {
    return {
      loadProgress: 50
    }
  },
  mounted() {
    // 挂载全局初始化事件
    const os = require('os')
    const platform = os.platform()
    this.$ipcRenderer.on('replyFilesLoadCount', this.onFileLoadStatus)
    document.addEventListener('keydown', function(e) {
      if (platform === 'win32') {
        if (e.ctrlKey && !Global.ctrlPressed) {
          Global.ctrlPressed = true
        }
      } else if (platform === 'mac') {
        if (e.metaKey && !Global.ctrlPressed) {
          Global.ctrlPressed = true
        }
      }
    })
    document.addEventListener('keyup', function(e) {
      if (platform === 'win32') {
        if (e.which === 17 && Global.ctrlPressed) {
          Global.ctrlPressed = false
        }
      } else if (platform === 'darwin') {
        if (e.metaKey && Global.ctrlPressed) {
          Global.ctrlPressed = false
        }
      }
    })
  },
  methods: {
    onFileLoadStatus(status) {
      const percent = parseInt(status.count * 100 / status.total)
      this.loadProgress = percent
      console.info('progress:', percent)
    }
  }
}
</script>

<style scoped>
.el-header {
  display: block;
  background-color: #333b46;
  color: rgb(248, 241, 241);
  height: 30px !important;
  padding: 0;
}
.display{
  /* border: 1px rgb(200, 240, 247);
  border-style: none dashed;
  border-radius: 5px; */
  height: 100%;
  margin: 0 10px 0 10px;
}
.nav-light {
  background: #2b3440;
}
.custom {
  height: 100%;
}
/* #loading-progress {
  position: relative;
  height: 2px;
  background: #dfdfdf;
}
@keyframes shimmer{
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 500px 0;
  }
}
#loading-progress::before {
  position: absolute;
  animation: shimmer infinite 2s linear;
  background: -webkit-repeating-linear-gradient(-0deg,#9dbafd 0, #6094f5 25%,#076ff7 50%, #6094f5 75%, #9dbafd 100%);
  height: 2px;
  width: 50%;
  content: '';
} */
</style>
