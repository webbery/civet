<template>
  <el-row >
      <el-col :span="4">
        <el-button @click="onClickImport" size="mini" round>导入</el-button>
        <el-button @click="onClickConfig" size="mini" round>配置</el-button>
        </el-col>
    <el-col :span="6" class="custom">
      <el-page-header @back="goBack" content="全部"></el-page-header>
    </el-col>
    <el-col :span="8" class="custom">
      <el-slider v-model="scaleValue" @input="scaleChange()" size="mini"></el-slider>
    </el-col>
    <el-col :span="6">
      <el-input placeholder="请输入搜索内容" v-model="keyword" class="input-with-select" size="mini">
        <el-select v-model="selection" slot="prepend" placeholder="类型">
          <el-option label="所有" value="1"></el-option>
          <el-option label="标签" value="2"></el-option>
          <el-option label="批注" value="3"></el-option>
        </el-select>
        <el-button slot="append" icon="el-icon-search" size="mini" round></el-button>
      </el-input>
    </el-col>
  </el-row>
</template>

<script>
import { remote } from 'electron'
import bus from './utils/Bus'
import localStorage from './utils/localStorage'
// import JString from '@/../public/String'

export default {
  name: 'header-bar',
  data() {
    return {
      scaleValue: 20,
      keyword: '',
      selection: ''
    }
  },
  methods: {
    onClickImport() {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then((data) => {
        if (data === undefined) return
        // this.$store.commit('updateImportDirectory', dir)
        if (data.canceled === true) return
        // 检查本地数据库中是否已经读取完当前的所有文件
        if (!localStorage.hasDirectory(data.filePaths[0])) {
          // 如果没有就发送消息继续读取
          this.$ipcRenderer.send(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
        } else {
          // 否则发送消息进行显示
          bus.emit(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
        }
      })
    },
    onClickConfig() {
      console.info('condif')
    },
    scaleChange() {
      console.info(this.scaleValue)
    }
  }
}
</script>

<style>
.custom .el-slider__runway {
  height: 6px;
  width: 50%;
  margin-top: 8px;
  margin-bottom: 0 !important;
  background-color: #FFFFFF;
  border: 1px solid #DCDFE6;
}
.custom .el-slider__bar {
  height: 6px;
}
.custom .el-slider__button {
  width: 8px;
  height: 8px;
}

.el-select .el-input {
  width: 80px;
}
.input-with-select .el-input-group__prepend {
  background-color: #fff;
}
</style>