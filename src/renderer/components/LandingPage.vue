<template>
  <el-container class="custom">
    <el-header>
      <HeaderBar></HeaderBar>
    </el-header>
    <el-row type="flex" class="row-bg">
      <el-col :span="4">
        <OrganizedPanel></OrganizedPanel>
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
import OrganizedPanel from '@/components/Panel/OrganizedPanel'
import ViewPanel from '@/components/ViewPanel'
import PropertyPanel from '@/components/Panel/PropertyPanel'
import TagPanel from '@/components/TagPanel'
import ConfigPanel from '@/components/ConfigPanel'
import Caxios from '@/../generated/caxios'

export default {
  name: 'landing-page',
  components: {
    HeaderBar,
    OrganizedPanel,
    ViewPanel,
    PropertyPanel,
    TagPanel,
    ConfigPanel
  },
  async mounted() {
    const {remote} = require('electron')
    const fs = require('fs')
    const userDir = remote.app.getPath('userData')
    const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
    const config = JSON.parse(fs.readFileSync(configPath))
    dbname = config.db.path
    const instance = await Caxios()
    // instance.sayHello()
    const caxios = new instance.Caxios(dbname + '.mdb')
    caxios.release()
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
