<template>
  <div>
    <dialog id="guider-config" class="modal">
      <label>配置你的第一个资源库:</label>
      <el-input placeholder="资源库名称" size="mini" v-model="resourceName" maxlength="16" show-word-limit @input="onInputChange"></el-input>
      <div style="margin-top: 15px;" size="mini">
        <el-input placeholder="资源库路径" v-model="resourceDBPath" class="input-with-select" :disabled="true" size="mini">
          <!-- <template slot="prepend">资源库路径：</template> -->
          <el-button slot="append" icon="el-icon-more" @click="onSelectDBPath()" size="mini"></el-button>
        </el-input>
      </div>
    <el-button @click="onStartCivet()" size="mini" type="success" :disabled="isDisable">完成</el-button>
    </dialog>
  </div>
</template>
<script>
import { remote } from 'electron'
import { CivetConfig } from '../../public/CivetConfig'
import Service from './utils/Service'

export default {
  name: 'Guider',
  data() {
    return {
      resourceName: '',
      resourceDBPath: '',
      isDisable: true
    }
  },
  mounted() {
  },
  methods: {
    showModal() {
      const cfg = document.getElementById('guider-config')
      cfg.showModal()
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
    onStartCivet() {
      if (this.resourceName.trim().length === 0 || this.resourceDBPath.length === 0) return
      const config = new CivetConfig()
      config.addResource(this.resourceName, this.resourceDBPath)
      config.save()
      const cfg = document.getElementById('guider-config')
      cfg.close()
      this.$ipcRenderer.send(Service.REINIT_DB)
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
.modal{
  background-color: #222933;
  font-size: 14px;
  font-weight: 600;
  color: aliceblue;
}
</style>