<template>
  <div>
    <el-input placeholder="请输入搜索内容" v-model="keyword"  size="mini" @keyup.enter.native="onExtentionSearch()">
    </el-input>
    <div v-if="keyword.length > 0">
    <table rules="none" cellspacing=0 style="table-layout: fixed;">
    <!-- <el-scrollbar style="height:99vh;"> -->
      <tr>
      <div v-for="extension in extensions">
        <div><span class="extname">{{extension.name}}</span><span class="extversion">{{extension.version}}</span></div>
        <div class="extdesc">{{extension.description}}</div>
        <button v-show="extension.state === 0" class="extension" @click="onInstall(extension)">install</button>
        <span v-show="extension.state === 1" class="el-icon-loading"></span>
        <button v-show="extension.state === 2" class="extension" @click="onUninstall(extension)">uninstall</button>
      </div>
      </tr>
    <!-- </el-scrollbar> -->
    </table>
    </div>
    <div v-else>
      <table rules="none" cellspacing=0 style="table-layout: fixed;">
    <!-- <el-scrollbar style="height:99vh;"> -->
      <tr>
      <div v-for="item in installed">
        <div><span class="extname">{{item.name}}</span><span class="extversion">{{item.version}}</span></div>
        <div class="extdesc">{{item.description}}</div>
        <button v-show="item.state === 0" class="extension" @click="onInstall(item)">install</button>
        <span v-show="item.state === 1" class="el-icon-loading"></span>
        <button v-show="item.state === 2" class="extension" @click="onUninstall(item)">uninstall</button>
      </div>
      </tr>
    <!-- </el-scrollbar> -->
    </table>
    </div>
  </div>
</template>
<script>
import Service from '../utils/Service'
import {logger} from '@/../public/Logger'

const INSTALL_STATUS = [
  0, // extension is not install
  1, // extension is installing/uninstalling
  2 // extension is installed
]

export default {
  name: 'extension-panel',
  components: {
  },
  data() {
    return {
      keyword: '',
      extensions: {},
      installed: {}
    }
  },
  async mounted() {
    const result = await this.$ipcRenderer.get(Service.LIST_EXTENSION)
    for (let item of result) {
      item.state = INSTALL_STATUS[2]
      this.$set(this.installed, item.name, item)
    }
    // logger.debug(`extensions result: ${JSON.stringify(result)}`)
  },
  methods: {
    updateExtensionState(name, state) {
      if (this.installed[name]) this.installed[name]['state'] = state
      if (this.extensions[name]) this.extensions[name]['state'] = state
    },
    async onInstall(extension) {
      const extInfo = {name: extension.name, version: extension.version}
      // logger.debug(`install extension: ${extInfo}`)
      extension['state'] = INSTALL_STATUS[1]
      const result = await this.$ipcRenderer.get(Service.INSTALL_EXTENSION, extInfo)
      logger.debug(`install result: ${JSON.stringify(result)}`)
      if (result.data === true) {
        this.updateExtensionState(extInfo.name, INSTALL_STATUS[0])
        extension['state'] = INSTALL_STATUS[0]
      } else {
        this.updateExtensionState(extInfo.name, INSTALL_STATUS[2])
        extension['state'] = INSTALL_STATUS[2]
      }
    },
    async onUninstall(extension) {
      extension['state'] = INSTALL_STATUS[1]
      const result = await this.$ipcRenderer.get(Service.UNINSTALL_EXTENSION, extension.name)
      console.info(`uninstall result: ${result}(${typeof result})`)
      if (result.data === true) {
        this.updateExtensionState(extension.name, INSTALL_STATUS[2])
        extension['state'] = INSTALL_STATUS[2]
      } else {
        this.updateExtensionState(extension.name, INSTALL_STATUS[0])
        extension['state'] = INSTALL_STATUS[0]
      }
    },
    onSetting(extension) {},
    onExtentionSearch() {
      // fetch @civet-ext package
      let kw = 'civet'
      if (this.keyword !== '') {
        kw = this.keyword
      }
      const fetchURL = 'https://api.npms.io/v2/search?q=scope:civet'// + kw
      // const fetchURL = 'https://api.npms.io/v2/search?q=scope:civet-ext'
      const { net } = require('electron').remote
      const request = net.request(fetchURL)
      let self = this
      let str = ''
      request.on('response', (response) => {
        response.on('end', () => {
          const extensions = JSON.parse(str)
          console.info('end', extensions)
          for (let ext of extensions.results) {
            let extension = {
              name: ext.package.name,
              version: ext.package.version,
              description: ext.package.description,
              author: {
                name: ext.package.author.name
              },
              state: INSTALL_STATUS[0]
            }
            if (self.installed.hasOwnProperty(extension.name)) {
              extension.state = INSTALL_STATUS[2]
            }
            self.$set(self.extensions, extension.name, extension)
          }
        })
        response.on('data', (chunk) => {
          // console.log(`BODY: ${chunk}`)
          str += chunk
        })
      })
      request.end()
    }
  }
}
</script>
<style scoped>
.extension {
  border: none;
  background-color: rgb(104, 219, 138);
  display: inline-block;
  border-radius: 4px;
  /* width: 25%; */
  height: 20px;
}
.extension-config {
  border: none;
  background-color: transparent;
  color: white;
  display: inline-block;
  border-radius: 4px;
  /* width: 25%; */
  height: 20px;
  float: right;
}
.extname {
  font-size: 14px;
  font-weight: bold;
}
.extversion {
  font-size: 10px;
}
.extdesc {
  font-size: 14px;
}
</style>