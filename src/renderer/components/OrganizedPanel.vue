<template>
  <div class="organize">
    <el-tabs v-model="activeName" class="custom">
      <el-tab-pane label="资源" name="resources">
        <el-scrollbar style="height:95vh;">
          <el-tree :data="resourceData" :render-content="renderContent" @node-click="handleResourceClick"></el-tree>
          <el-divider content-position="left">文件夹</el-divider>
          <el-tree :data="folders" :render-content="renderContent" @node-click="handleFolderClick"></el-tree>
          <el-button type="primary" icon="el-icon-plus" size="mini" circle></el-button>
        </el-scrollbar>
      </el-tab-pane>
      <el-tab-pane label="本地目录" name="direcories" class="directory" >
        <el-scrollbar style="height:90vh;">
          <el-tree :data="directoryData" ></el-tree>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from './utils/Bus'
import localStorage from '@/../public/LocalStorage'
import JString from '@/../public/String'

export default {
  name: 'organized-panel',
  data() {
    return {
      activeName: 'resources',
      resourceData: [
        {
          label: '全部',
          name: 'all',
          icon: 'el-icon-folder-opened',
          children: []
        },
        {
          label: '未分类',
          name: 'unclass',
          icon: 'el-icon-copy-document',
          children: []
        },
        {
          label: '未标签',
          name: 'untag',
          icon: 'el-icon-collection-tag',
          children: []
        },
        {
          label: '标签管理',
          name: 'manageTag',
          icon: 'el-icon-collection',
          children: []
        }
      ],
      directoryData: [],
      folders: [{label: '测试', icon: 'el-icon-suitcase'}]
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
    this.$ipcRenderer.on(bus.WORKER_UPDATE_IMAGE_DIRECTORY, this.updateDisplayImageList)
    this.init()
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateDisplayImageList(appendFiles) {
      // console.info('recieve from worker message:', appendFiles)
      let dirs = {}
      for (let item of appendFiles) {
        if (dirs[item.path] === undefined) {
          dirs[item.path] = []
        }
        dirs[item.path].push({label: item.filename})
        // 更新视图共享数据
        this.$store.dispatch('addImage', {id: item.id, label: item.filename, path: JString.joinPath(item.path, item.filename), src: item.thumbnail})
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
      // 更新目录窗口
      localStorage.addImages(appendFiles)
      // localStorage.set('directories', this.directoryData)
    },
    async init() {
      this.directoryData = await localStorage.getImagesWithDirectoryFormat()
      // console.info('init: ', this.directoryData)
    },
    renderContent(h, {node, data, store}) {
      console.info('renderContent', data)
      return (
        <span>
          <i class={data.icon}></i>
          <span> {node.label}</span>
        </span>
      )
    },
    handleResourceClick(node) {
      console.info(node)
      switch (node.name) {
        case 'manageTag':
          this.$router.push({path: '/tagManager'})
          break
        case 'all':
          this.$router.push({path: '/'})
          break
        default:
          this.$router.push({path: '/'})
          break
      }
      bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, node.label)
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
</style>