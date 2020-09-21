<template>
  <div class="config">
    <div style="margin-top: 15px;">
      <el-input placeholder="请输入内容" v-model="config.resource.path" class="input-with-select" :disabled="true">
        <template slot="prepend">资源库路径：</template>
          <el-button slot="append" icon="el-icon-more" @click="onSelectResourcePath()"></el-button>
      </el-input>
      <label>提示：资源库只保存文件的硬链接，不会占用额外的空间</label>
    </div>
    <div style="margin-top: 15px;">
      <el-input placeholder="请输入内容" v-model="config.db.path" class="input-with-select" :disabled="true">
        <template slot="prepend">数据库路径：</template>
        <el-button slot="append" icon="el-icon-more" @click="onSelectDBPath()"></el-button>
      </el-input>
      <label>提示：数据库存储文件的数据信息。如果删除掉，所有文件数据将不再可用，标签及分类等信息完全丢失</label>
    </div>
  <el-button :disabled="!enableTransfer" slot="append" @click="onStartTransfer()">{{tansferMessage}}</el-button>
  <div class="modules">
    <el-divider content-position="left">可用插件</el-divider>
    <el-collapse v-model="valiablePlugins" @change="handlePluginChange">
      <div v-for="(item, idx) of valiablePlugins" :key="idx">
      <el-collapse-item :title="item.name" :name="idx">
        <div>
          <el-checkbox v-model="item.valid"></el-checkbox>
        </div>
      </el-collapse-item>
      </div>
    </el-collapse>
    <el-divider content-position="left">插件配置</el-divider>
    <el-collapse v-model="activeNames" @change="handleFormatChange">
      <el-collapse-item title="格式支持" name="1">
        <el-checkbox v-model="checked">jpg/bmp</el-checkbox>
      </el-collapse-item>
      <el-collapse-item title="检索支持" name="2">
        <div>
          <el-checkbox v-model="checked">关键字</el-checkbox>
          <el-dropdown split-button type="mini">
            信息抽取模型
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>黄金糕</el-dropdown-item>
              <el-dropdown-item>狮子头</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <div>
          <el-checkbox v-model="checked">主色彩</el-checkbox>
        </div>
        <div>
          <el-checkbox v-model="checked">子图</el-checkbox>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
  </div>
</template>

<script>
import bus from './utils/Bus'
import { remote } from 'electron'
import Service from './utils/Service'
import Folder from './utils/Folder'
import fs from 'fs'
import Plugins from '@/../public/Plugin'

export default {
  name: 'config-page',
  data() {
    return {
      configPath: '',
      enableTransfer: false,
      tansferMessage: '开始迁移',
      oldConfig: {
        resource: {},
        db: {}
      },
      config: {
        resource: {},
        db: {}
      },
      valiablePlugins: [
        {path: '', name: 'image', version: '0.0.1', valid: true}
      ],
      plugins: {
        format: {},
        search: {}
      }
    }
  },
  mounted() {
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '配置', cmd: 'cfg'})
    const userDir = remote.app.getPath('userData')
    this.configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
    this.config = JSON.parse(fs.readFileSync(this.configPath))
    this.oldConfig = JSON.parse(JSON.stringify(this.config))
    this.loadPlugins()
  },
  methods: {
    loadPlugins: () => {
      this.valiablePlugins = []
      const modules = Plugins.load()
      for (let plg of modules) {
        let item = {path: '', name: plg.name, version: plg.version, valid: true}
        this.valiablePlugins.push(item)
      }
    },
    onSelectResourcePath: () => {
      console.info('select resource Path')
    },
    onSelectDBPath() {
      let self = this
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then(async (data) => {
        if (data === undefined) return
        if (data.canceled === true) return
        self.config.db.path = data.filePaths[0]
        console.info(self.oldConfig.db.path, self.config.db.path)
        if (self.oldConfig.db.path !== self.config.db.path) {
          self.enableTransfer = true
        }
      })
    },
    async onStartTransfer() {
      // console.info('old', this.oldConfig.db.path, ' new', this.config.db.path)
      if (this.oldConfig.db.path !== this.config.db.path) {
        this.enableTransfer = false
        this.tansferMessage = '迁移中'
        // 目标文件夹是否存在
        // 复制数据库
        Folder.copyFolder(this.oldConfig.db.path, this.config.db.path)
        const status = await this.$ipcRenderer.get(Service.REINIT_DB, this.config.db.path)
        if (status) {
          this.tansferMessage = '迁移完成'
          // 保存配置
          fs.writeFileSync(this.configPath, JSON.stringify(this.config))
          this.oldConfig.db.path = this.config.db.path
        }
      }
    }
  }
}
</script>

<style scoped>
.config {
  margin: 10%;
}
label {
  font-size: 12px;
  color: dimgrey;
}
.modules {
  margin-top: 25px;
}
</style>