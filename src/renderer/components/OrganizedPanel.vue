<template>
  <div class="organize">
    <el-tabs v-model="activeName" class="custom">
      <el-tab-pane label="资源" name="resources">
        <el-scrollbar style="height:95vh;">
          <table>
            <tr class="item" @click="handleResourceClick(headOptions[0])"><i :class="headOptions[0].icon"></i><td>全部</td><td /></tr>
            <tr class="item" @click="handleResourceClick(headOptions[1])"><i :class="headOptions[1].icon"></i><td>未分类</td><td>{{headOptions[1].value}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[2])"><i :class="headOptions[2].icon"></i><td>未标签</td><td>{{headOptions[2].value}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[3])"><i :class="headOptions[3].icon"></i><td>标签管理</td><td></td></tr>
          </table>
          <el-row type="flex">
          <el-col :span="22"><fieldset class="hor-line"><legend class="inner">分类文件夹</legend></fieldset></el-col>
          <el-col :span="2"><button class="noselection" @click="onAddFolder()">+</button></el-col>
          </el-row>
          <div>
          <FolderTree :data="folders"></FolderTree>
          <IconFolder icon="el-icon-folder" enableInput="true" v-if="newFolder"></IconFolder>
          </div>
        </el-scrollbar>
      </el-tab-pane>
      <el-tab-pane label="本地目录" name="direcories" class="directory" >
        <el-scrollbar style="height:90vh;">
          <el-tree :data="directoryData"></el-tree>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from './utils/Bus'
import JString from '@/../public/String'
import Service from '@/components/utils/Service'
import FolderTree from '@/components/FolderTree'
import IconFolder from '@/components/IconFolder'

export default {
  name: 'organized-panel',
  components: {
    FolderTree,
    IconFolder
  },
  data() {
    return {
      activeName: 'resources',
      headOptions: [
        {
          label: '全部',
          name: 'all',
          icon: 'el-icon-suitcase'
        },
        {
          label: '未分类',
          name: 'unclass',
          icon: 'el-icon-copy-document',
          value: 0
        },
        {
          label: '未标签',
          name: 'untag',
          icon: 'el-icon-collection-tag',
          value: 0
        },
        {
          label: '标签管理',
          name: 'manageTag',
          icon: 'el-icon-collection',
          children: []
        }
      ],
      directoryData: [],
      folders: [],
      newFolder: false
    }
  },
  computed: {
    loadDirectory() {
      console.info('computed：', this.$store.EventBus.importDirectory)
      return this.$store.EventBus.importDirectory
    }
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, this.updateLoadingDirectories)
    this.$ipcRenderer.on(Service.ON_IMAGE_UPDATE, this.updateDisplayImageList)
    this.init()
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateDisplayImageList(error, appendFiles) {
      if (error) console.log(error)
      // console.info('recieve from worker message:', appendFiles)
      let dirs = {}
      for (let item of appendFiles) {
        if (dirs[item.path] === undefined) {
          dirs[item.path] = []
        }
        dirs[item.path].push({label: item.filename})
        // 更新视图共享数据
        this.$store.dispatch('addImage', {id: item.id, label: item.filename, path: JString.joinPath(item.path, item.filename), thumbnail: item.thumbnail})
      }

      // console.info(this.directoryData)
      for (let item of this.directoryData) {
        // console.info('***', item.label, dirs[item.label])
        if (dirs[item.label] !== undefined) {
          for (let files of dirs[item.label]) {
            item.children.push({label: files.label})
          }
          delete dirs[item.label]
        }
      }
      for (let k in dirs) {
        this.directoryData.push({label: k, children: dirs[k]})
      }
    },
    async init() {
      this.directoryData = await this.$ipcRenderer.get(Service.GET_IMAGES_DIRECTORY)
      this.folders = await this.$ipcRenderer.get(Service.GET_ALL_CATEGORY)
      const uncategoryImages = await this.$ipcRenderer.get(Service.GET_UNCATEGORY_IMAGES)
      this.headOptions[1].value = uncategoryImages.length
      console.info(uncategoryImages)
      this.$store.dispatch('setCategory', this.folders)
    },
    renderContent(h, {node, data, store}) {
      // console.info('renderContent', data)
      return (
        <span>
          <i class={data.icon}></i>
          <span> {node.label}</span>
        </span>
      )
    },
    handleResourceClick(node) {
      // console.info(node)
      switch (node.name) {
        case 'manageTag':
          this.$router.push({path: '/tagManager', query: {name: node.label, cmd: 'manage-tag'}})
          break
        case 'all':
          this.$router.push({path: '/', query: {name: node.label, cmd: 'display-all'}})
          break
        default:
          this.$router.push({path: '/', query: {cmd: 'display-all'}})
          break
      }
    },
    onAddFolder() {
      // 添加一个分类文件夹
      this.newFolder = true
    }
  }
}
</script>

<style scoped>
.directory{
  height: 100%;
}
el-tab-pane {
  overflow-y:auto;
  overflow-x:hidden;
}
.el-tabs--left .el-tabs__nav.is-left, .el-tabs--left .el-tabs__nav.is-right, .el-tabs--right .el-tabs__nav.is-left, .el-tabs--right .el-tabs__nav.is-right {
  height: 100%;
  overflow-y: scroll;
}
.custom .el-tabs__item{
  line-height: 20px;
  font-size: 12px;
  font-weight: 300;
}
.custom .is-top{
  height: 20px;
}
.hor-line {
  /* font-size: 14px; */
  color: #999;
  border: 0;
  border-top: 1px solid #ccc;
  padding: 0;
}
.inner{
  margin: 0 20px;
  padding: 0 10px;
}
.noselection{
  color: #999;
  -webkit-user-select: none;
  border-radius: 10px;
  border: none;
  outline: none;
}
.noselection:hover{
  background-color: rgb(0, 153, 255);
}
.noselection:hover:after {
  color: white;
  position: absolute;
  width: 100px;
  height: 25px;
  content: '单击添加新的分类';
  z-index: 99999;
}
.item:hover {
  background-color:rgb(225, 240, 250);
  -webkit-user-select: none;
}
</style>