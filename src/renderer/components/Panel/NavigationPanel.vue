<template>
  <div class="organize">
    <el-tabs v-model="activeName" class="custom">
      <el-tab-pane label="资源" name="resources">
        <el-scrollbar style="height:95vh;">
          <table rules="none" cellspacing=0 >
            <tr class="item" @click="handleResourceClick(headOptions[0])"><i :class="headOptions[0].icon"></i><td>全部</td><td /></tr>
            <tr class="item" @click="handleResourceClick(headOptions[1])"><i :class="headOptions[1].icon"></i><td>未分类</td><td>{{unclasses}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[2])"><i :class="headOptions[2].icon"></i><td>未标签</td><td>{{untags}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[3])"><i :class="headOptions[3].icon"></i><td>标签管理</td><td></td></tr>
          </table>
          <TreePanel :isActive="true">
            <FolderTree :data="category"></FolderTree>
          </TreePanel>
        </el-scrollbar>
      </el-tab-pane>
      <!-- <el-tab-pane label="本地目录" name="direcories" class="directory" >
        <el-scrollbar style="height:90vh;">
          <el-tree :data="directoryData"></el-tree>
        </el-scrollbar>
      </el-tab-pane> -->
    </el-tabs>
  </div>
</template>

<script>
import bus from '../utils/Bus'
import FolderTree from '@/components/Control/FolderTree'
import TreePanel from '@/components/Panel/TreePanel'
import { mapState } from 'vuex'

export default {
  name: 'navigation-panel',
  components: {
    FolderTree,
    TreePanel
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
          icon: 'el-icon-collection'
        }
      ],
      newFolder: false,
      // category: [{name: 'test.jpg', type: 'jpg', id: 1}, {name: 'test', type: 'dir', id: 1, children: [{name: 'test2.jpg', type: 'jpg', id: 1}]}], // [{label: name, type: dir/jpg, children: []}]
      newCategoryName: ''
    }
  },
  computed: mapState({
    // loadDirectory() {
    //   console.info('computed：', this.$store.EventBus.importDirectory)
    //   return this.$store.EventBus.importDirectory
    // },
    // categoryName() {
    //   return this.$store.getters.classesName
    // },
    category: state => state.Cache.classes,
    untags: state => state.Cache.untags,
    unclasses: state => state.Cache.unclasses
  }),
  mounted() {
    bus.on(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, this.updateLoadingDirectories)
    bus.on(bus.EVENT_UPDATE_UNCATEGORY_IMAGES, this.updateUncategoryImages)
    this.init()
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateUncategoryImages(updateValue) {
      this.headOptions[1].value += updateValue
    },
    // updateUntagFiles() {
    //   const untags = this.$kernel.getUnTagFiles()
    //   this.headOptions[2].value = untags.length
    // },
    // updateUnclassifyFiles() {
    //   const unclasses = this.$kernel.getUnClassifyFiles()
    //   this.headOptions[1].value = unclasses.length
    // },
    init() {
      const snaps = this.$kernel.getFilesSnap()
      let category = []
      for (let item of snaps) {
        category.push({label: item.display, id: item.id, step: item.step})
      }
      this.category = category
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
      switch (node.name) {
        case 'manageTag':
          this.$router.push({path: '/tagManager', query: {name: node.label, cmd: 'manage-tag'}})
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '标签管理', cmd: 'display-tag'})
          break
        case 'untag':
          this.$router.push({path: '/untag', query: {name: node.label, cmd: ''}})
          bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, {name: '未标签', cmd: 'display-tagless'})
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
.item:hover {
  background-color:rgb(16, 125, 197);
  -webkit-user-select: none;
}
.item {
  font-size: 14px;
}

table {
  width: 100%;
}

</style>