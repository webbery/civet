<template>
  <div>
    <label>配置你的第一个资源库</label>
    <el-input>{{resourceName}}</el-input>
    <div style="margin-top: 15px;">
      <el-input placeholder="请输入内容" v-model="resourceDBPath" class="input-with-select" :disabled="true">
        <template slot="prepend">资源库路径：</template>
        <el-button slot="append" icon="el-icon-more" @click="onSelectDBPath()"></el-button>
      </el-input>
    </div>
  <el-button @click="onStartCivet()">启动</el-button>
  </div>
</template>
<script>
import { remote } from 'electron'
import { CivetConfig } from '../../public/CivetConfig'

export default {
  name: 'Guider',
  data() {
    return {
      resourceName: '',
      resourceDBPath: ''
    }
  },
  mounted() {},
  methods: {
    onStartCivet() {
      if (this.resourceName.trim().length === 0 || this.resourceDBPath.length === 0) return
      const config = new CivetConfig()
      config.addResource(this.resourceName, this.resourceDBPath)
      config.save()
      this.$ipcRenderer.send('ready')
    },
    onSelectDBPath() {
      let self = this
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then(async (data) => {
        if (data === undefined) return
        if (data.canceled === true) return
        self.resourceDBPath = data.filePaths[0]
        if (self.resourceDBPath) {
          self.enableTransfer = true
        }
      })
    }
  }
}
</script>