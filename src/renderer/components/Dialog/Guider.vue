<template>
  <div>
    <el-input placeholder="资源库名称" size="mini" v-model="resourceName" maxlength="16" show-word-limit @input="onInputChange"></el-input>
    <div style="margin-top: 15px;" size="mini">
      <el-input placeholder="资源库路径" v-model="resourceDBPath" class="input-with-select" :disabled="true" size="mini">
        <!-- <template slot="prepend">资源库路径：</template> -->
        <el-button slot="append" icon="el-icon-more" @click="onSelectDBPath()" size="mini"></el-button>
      </el-input>
    </div>
    <div class="error">{{msg}}</div>
  <el-button @click="onStartCivet()" size="mini" type="success" :disabled="isDisable">完成</el-button>
  <el-button @click="onClose()" size="mini" type="info" v-if="enableClose">取消</el-button>
  </div>
</template>
<script>
import { remote } from 'electron'
import { config } from '../../../public/CivetConfig'
import { IPCRendererResponse } from '@/../public/IPCMessage'
import bus from '../utils/Bus'

export default {
  name: 'Guider',
  data() {
    return {
      resourceName: '',
      resourceDBPath: '',
      isDisable: true,
      msg: ''
    }
  },
  props: {
    enableClose: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
  },
  methods: {
    onClose() {
      this.$emit('onclose')
    },
    onInputChange(val) {
      const input = val.trim()
      console.info(input, ',', this.resourceDBPath)
      if (input.length !== 0 && this.resourceDBPath.length !== 0) {
        this.isDisable = false
      } else {
        this.isDisable = true
      }
    },
    async onStartCivet() {
      if (this.resourceName.trim().length === 0 || this.resourceDBPath.length === 0) return
      // is file exist?
      const fs = require('fs')
      if (fs.existsSync(this.resourceDBPath + '/' + this.resourceName)) {
        // file exist
        this.msg = '文件已存在'
        return
      }
      config.addResource(this.resourceName, this.resourceDBPath)
      console.info('config:', config)
      config.save()
      bus.emit(bus.EVENT_INIT_RESOURCE_DB, this.resourceName)
      await this.$ipcRenderer.get(IPCRendererResponse.REINIT_DB, this.resourceName)
      // await this.$ipcRenderer.get(Service.REINIT_DB, this.resourceName)
      // this.$ipcRenderer.send(Service.REINIT_DB)
      this.$emit('onsuccess', this.resourceName)
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
          self.isDisable = false
        } else {
          self.isDisable = true
        }
      })
    }
  }
}
</script>
<style scoped>
.error {
  color: rgb(199, 12, 12);
}
</style>