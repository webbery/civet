<template>
  <div>
    <el-input placeholder="请输入搜索内容" v-model="keyword"  size="mini" @keyup.enter.native="onExtentionSearch()">
    </el-input>
    <div v-if="keyword.length > 0">
    <table rules="none" cellspacing=0 style="table-layout: fixed;">
    <!-- <el-scrollbar style="height:99vh;"> -->
      <tr>
      <div v-for="(extension, idx) in extensions" :key="idx">
        <div><span class="extname">{{extension.name}}</span><span class="extversion">{{extension.version}}</span></div>
        <div class="extdesc">{{extension.description}}</div>
        <button class="extension" @click="onInstall(extension)">install</button>
        <button class="extension el-icon-setting" @click="onSetting(extension)"></button>
      </div>
      </tr>
    <!-- </el-scrollbar> -->
    </table>
    </div>
    <div v-else>
      hello extension
    </div>
  </div>
</template>
<script>
import Service from '../utils/Service'

export default {
  name: 'extension-panel',
  components: {
  },
  data() {
    return {
      keyword: '',
      extensions: [
        {
          name: '测试',
          version: '0.1',
          description: '描述',
          score: 0.6,
          author: {
            name: 'Kitty'
          }
        }
      ]
    }
  },
  mounted() {
  },
  methods: {
    onInstall(extension) {
      this.$ipcRenderer.send(Service.INSTALL_EXTENSION, extension.name)
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
      self.extensions = []
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
              }
            }
            self.extensions.push(extension)
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
  background-color: #4CAF50;
  display: inline-block;
  border-radius: 4px;
  width: 25%;
  height: 20px;
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