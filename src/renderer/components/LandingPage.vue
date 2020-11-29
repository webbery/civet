<template>
  <el-container class="custom">
    <el-header>
      <HeaderBar></HeaderBar>
    </el-header>
    <el-row type="flex" class="row-bg">
      <el-col :span="4">
        <NavigationPanel></NavigationPanel>
      </el-col>
      <el-col :span="16">
        <div class="display"><router-view></router-view></div>
      </el-col>
      <el-col :span="4">
        <PropertyPanel></PropertyPanel>
      </el-col>
    </el-row>
  </el-container>
</template>

<script>
import HeaderBar from '@/components/HeaderBar'
import NavigationPanel from '@/components/Panel/NavigationPanel'
import ViewPanel from '@/components/Panel/ViewPanel'
import PropertyPanel from '@/components/Panel/PropertyPanel'
import TagPanel from '@/components/Panel/TagPanel'
import ConfigPanel from '@/components/ConfigPanel'
import Global from '@/components/utils/Global'

export default {
  name: 'landing-page',
  components: {
    HeaderBar,
    NavigationPanel,
    ViewPanel,
    PropertyPanel,
    TagPanel,
    ConfigPanel
  },
  mounted() {
    // 挂载全局初始化事件
    const os = require('os')
    const platform = os.platform()
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
      } else if (platform === 'mac') {
        if (e.metaKey && Global.ctrlPressed) {
          Global.ctrlPressed = false
        }
      }
    })
  }
}
</script>

<style scoped>
.el-header {
  display: block;
  background-color: #333b46;
  color: rgb(248, 241, 241);
  height: 30px !important;
}
.display{
  border: 1px rgb(200, 240, 247);
  border-style: none dashed;
  border-radius: 5px;
  margin: 0 10px 0 10px;
}
</style>
