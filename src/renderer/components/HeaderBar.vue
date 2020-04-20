<template>
  <el-row >
      <el-col :span="4">
        <el-button @click="onClickImport">导入</el-button>
        <el-button @click="onClickConfig">配置</el-button>
        </el-col>
    <el-col :span="16">贡献者名单</el-col>
    <el-col :span="4">
      <el-input placeholder="请输入内容" v-model="input3" class="input-with-select">
        <el-select v-model="select" slot="prepend" placeholder="请选择">
          <el-option label="所有" value="1"></el-option>
          <el-option label="标签" value="2"></el-option>
          <el-option label="批注" value="3"></el-option>
        </el-select>
        <el-button slot="append" icon="el-icon-search"></el-button>
      </el-input>
    </el-col>
  </el-row>
</template>

<script>
import { remote } from 'electron'
import bus from './utils/Bus'

export default {
  name: 'header-bar',
  methods: {
    onClickImport() {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then((data) => {
        if (data === undefined) return
        // this.$store.commit('updateImportDirectory', dir)
        if (data.canceled === true) return
        bus.emit(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
        this.$ipcRenderer.send(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
      })
    },
    onClickConfig() {
      console.info('condif')
    }
  }
}
</script>

<style scoped>

</style>