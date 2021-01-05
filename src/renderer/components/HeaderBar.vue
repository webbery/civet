<template>
  <el-row >
      <el-col :span="4">
        <el-button @click="onClickConfig" type="text" size="mini" icon="el-icon-setting" circle></el-button>
        <el-dropdown>
          <el-button @click="onClickResource" size="mini" round>{{resource}}<i class="el-icon-arrow-down el-icon--right"></i></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>{{resource}}</el-dropdown-item>
            <el-dropdown-item divided>最近使用</el-dropdown-item>
            <el-dropdown-item divided>新建资源库</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <!-- <el-button @click="onClickImport" size="mini" round>导入</el-button> -->
        </el-col>
    <el-col :span="5" class="custom">
      <el-page-header @back="goBack" :content="viewDesc"></el-page-header>
    </el-col>
    <el-col :span="9" class="custom">
      <component :is="comName"></component>
    </el-col>
    <el-col :span="1">
      <el-dropdown size="mini" >
        <span class="selected">
          所有<i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item>所有</el-dropdown-item>
          <el-dropdown-item>标签</el-dropdown-item>
          <el-dropdown-item>分类</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </el-col>
    <el-col :span="5">
      <el-input placeholder="请输入搜索内容" v-model="keyword" class="input-with-select" size="mini" @keyup.enter.native="onSearch()">
        <el-button slot="append" icon="el-icon-search" size="mini" round @click="onSearch()"></el-button>
      </el-input>
    </el-col>
  </el-row>
</template>

<script>
import { remote } from 'electron'
import bus from './utils/Bus'
import ViewFilter from '@/components/ViewFilter'
import ImageOperator from '@/components/ImageOperator'
import Service from '@/components/utils/Service'
import { CivetConfig } from '@/../public/CivetConfig'

export default {
  name: 'header-bar',
  data() {
    return {
      comName: ViewFilter,
      scaleValue: 20,
      keyword: '',
      resource: '资源库',
      viewDesc: '全部'
    }
  },
  components: {
    ViewFilter,
    ImageOperator
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_NAV_DESCRIBTION, this.onUpdateHeadNav)
    bus.on(bus.EVENT_INIT_RESOURCE_DB, this.onInitResourceDB)
    const config = new CivetConfig()
    const resource = config.getCurrentResource()
    console.info('header', resource)
    this.resource = resource.name
  },
  methods: {
    onClickResource() {},
    onInitResourceDB(dbname) {
      this.resource = dbname
    },
    onClickImport() {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory', 'openFile']
      }).then(async (data) => {
        if (data === undefined) return
        // this.$store.commit('updateImportDirectory', dir)
        if (data.canceled === true) return
        // 检查本地数据库中是否已经读取完当前的所有文件
        if (await this.$ipcRenderer.get(Service.IS_DIRECTORY_EXIST, data.filePaths[0]) === false) {
          // 如果没有就发送消息继续读取
          this.$ipcRenderer.send(Service.ADD_IMAGES_BY_DIRECORY, data.filePaths[0])
        } else {
          // 否则发送消息进行显示
          // bus.emit(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, data.filePaths[0])
        }
      })
    },
    onClickConfig() {
      this.viewDesc = '配置'
      this.$router.push({path: '/config'})
    },
    onUpdateHeadNav(query) {
      this.viewDesc = query.name
      console.info(query.cmd)
      switch (query.cmd) {
        case 'display-tag':
        case 'display-all':
          this.comName = ViewFilter
          break
        case 'display':
          this.comName = ImageOperator
          break
        default:
          break
      }
    },
    goBack() {
      if (window.history.length === 0) {
        console.info('no more page')
        return
      }
      this.$router.go(-1)
    },
    async onSearch() {
      const keywords = this.keyword.split(' ')
      console.info('keywords', keywords)
      this.$store.dispatch('query', {keyword: keywords})
      // const imagesID = await this.$ipcRenderer.get(Service.FIND_IMAGES_BY_KEYWORD, keywords)
      // console.info('imagesID', imagesID)
      // const images = await this.$ipcRenderer.get(Service.GET_IMAGES_INFO, imagesID)
      // console.info('images', images)
      // let updateImages = []
      // for (let idx in images) {
      //   const item = images[idx]
      //   updateImages.push({id: imagesID[idx], label: item.label, path: item.path, thumbnail: item.thumbnail})
      // }
      // this.$store.dispatch('clearImages')
      // this.$store.dispatch('updateImageList', updateImages)
      this.$router.push({path: '/query', query: {name: '检索“' + this.keyword + '”', type: 'keyword'}})
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
.el-page-header__left {
  display:inline;
  padding-right: 5px;
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
.selected{
  font-size: 12px;
}
</style>