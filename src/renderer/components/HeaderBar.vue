<template>
  <el-row >
      <el-col :span="2">
        <el-dropdown trigger="click" :hide-on-click="false">
          <el-button size="mini" round>{{currentResource}}<i class="el-icon-arrow-down el-icon--right"></i></el-button>
          <el-dropdown-menu slot="dropdown" style="width: 200px">
            <PageMenu :resources="allResources" :current="currentResource" @onswitch="onResourceSwitch" @ondelete="onResourceDelete"></PageMenu>
          </el-dropdown-menu>
        </el-dropdown>
        <!-- <el-button @click="onClickImport" size="mini" round>导入</el-button> -->
        </el-col>
    <el-col :span="2" class="custom">
      <el-page-header @back="goBack" :content="viewDesc" :style="[disabled?style:'']"></el-page-header>
    </el-col>
    <!-- <el-col :span="1">
      <el-dropdown size="mini" trigger="click" @command="onQueryKindChange">
        <span class="query-kind">
          {{queryKinds[queryIdx].name}}<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item :key="idx" v-for="(queryKind, idx) in queryKinds" :command="queryKind.command">
            {{queryKind.name}}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </el-col> -->
    <el-col :span="14" class="custom">
      <component :is="comName"></component>
    </el-col>
    <el-col :span="4">
      <SearchBar></SearchBar>
      <!-- <el-input placeholder="请输入搜索内容" v-model="keyword" class="input-with-select" size="mini" @keyup.enter.native="onSearch()">
        <el-button slot="append" icon="el-icon-search" size="mini" round @click="onSearch()"></el-button>
      </el-input> -->
    </el-col>
    
  </el-row>
</template>

<script>
import { remote } from 'electron'
import bus from './utils/Bus'
import ViewFilter from '@/components/ViewFilter'
import ImageOperator from '@/components/ImageOperator'
import { IPCRendererResponse } from '@/../public/IPCMessage'
// import Service from '@/components/utils/Service'
import PageMenu from '@/components/Menu/PageMenu'
import { mapState } from 'vuex'
// import { config } from '@/../public/CivetConfig'
import SearchBar from '@/components/Control/SearchBar/SearchBar'

export default {
  name: 'header-bar',
  data() {
    return {
      comName: ViewFilter,
      scaleValue: 20,
      keyword: ['preset-1', 'preset-2'],
      recentResources: [],
      viewDesc: '全部',
      disabled: true,
      style: {
        'pointer-events': 'none',
        'color': 'gray'
      },
      queryIdx: 0,
      queryKinds: [
        {name: '所有', command: 'all'},
        {name: '标签', command: 'tag'},
        {name: '分类', command: 'class'}
      ]
    }
  },
  components: {
    ViewFilter,
    ImageOperator,
    PageMenu,
    SearchBar
  },
  computed: mapState({
    allResources: state => {
      return state.Cache.resources
    },
    currentResource: state => state.Cache.currentResource
  }),
  mounted() {
    bus.on(bus.EVENT_UPDATE_NAV_DESCRIBTION, this.onUpdateHeadNav)
    // bus.on(bus.EVENT_INIT_RESOURCE_DB, this.onInitResourceDB)
    // this.recentResources.push(resource.name)
  },
  methods: {
    getCurrentIndex() {
      const resources = this.$store.state.Cache.resources
      const currentName = this.$store.state.Cache.currentResource
      console.info('current display', currentName)
      for (let idx = 0, len = resources.length; idx < len; ++idx) {
        if (currentName === resources[idx]) {
          return idx
        }
      }
    },
    async onResourceSwitch(resource) {
      this.$store.dispatch('switchResource', resource)
      await this.$ipcRenderer.get(IPCRendererResponse.REINIT_DB, resource)
      this.$nextTick(() => {
        this.current = this.getCurrentIndex()
        this.$store.dispatch('clear')
        this.$store.dispatch('init')
      })
    },
    onResourceDelete(resource) {
      this.$store.dispatch('delResource', resource)
    },
    // onInitResourceDB(dbname) {
    //   console.info('onInitResourceDB', dbname)
    //   this.currentResource = dbname
    // },
    onQueryKindChange(cmd) {
      switch (cmd) {
        case 'all':
          this.queryIdx = 0
          break
        case 'tag':
          this.queryIdx = 1
          break
        case 'class':
          this.queryIdx = 2
          break
        default:
          break
      }
    },
    onClickImport() {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then(async (data) => {
        if (data === undefined) return
        // this.$store.commit('updateImportDirectory', dir)
        if (data.canceled === true) return
        // 检查本地数据库中是否已经读取完当前的所有文件
        if (await this.$ipcRenderer.get(IPCRendererResponse.IS_DIRECTORY_EXIST, data.filePaths[0]) === false) {
          // 如果没有就发送消息继续读取
          this.$ipcRenderer.send(IPCRendererResponse.ADD_IMAGES_BY_DIRECORY, data.filePaths[0])
        } else {
          // 否则发送消息进行显示
          // bus.emit(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
        }
      })
    },
    onUpdateHeadNav(query) {
      this.viewDesc = query.name
      console.info(query.cmd)
      switch (query.cmd) {
        case 'display-tag':
        case 'display-all':
        case 'display-keyword':
          this.comName = ViewFilter
          break
        case 'display':
          this.comName = ImageOperator
          break
        default:
          break
      }
      this.$nextTick(() => {
        if (this.$store.state.Cache.histories === 0) {
          console.info('disable back')
          this.disabled = true
        } else {
          this.disabled = false
        }
      })
    },
    goBack() {
      if (this.$store.state.Cache.histories === 0) {
        console.info('no more page')
        return
      }
      this.$store.dispatch('updateHistoryLength', this.$store.state.Cache.histories - 1)
      this.$router.go(-1)
    },
    async onSearch() {
      const keywords = this.keyword.split(' ')
      console.info('keywords', keywords)
      switch (this.queryIdx) {
        case 0:
          this.$store.dispatch('query', {keyword: keywords})
          break
        case 1:
          this.$store.dispatch('query', {tag: keywords})
          break
        case 2:
          this.$store.dispatch('query', {class: keywords})
          break
        default: break
      }
      this.$router.push({path: '/query', query: {name: '检索“' + this.keyword + '”', type: 'keyword'}})
    },
    addKeyword(value) {
      console.info('addKeyword:', value)
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
.input-with-select {
  z-index: 99;
  transform: translateY(-4px);
}
.el-page-header__left {
  display:inline;
  cursor:default;
  padding-right: 5px;
}
.el-page-header__left:hover{
  color: rgb(84, 155, 236);
}
.el-page-header__title {
  display:inline;
}
.el-page-header__content {
  display:inline;
  font-size: large;
  border-top-style: none;
	border-right-style: none;
	border-bottom-style: none;
  border-left-style: solid;
  padding-left: 10px;
}
.query-kind{
  font-size: 12px;
}
</style>