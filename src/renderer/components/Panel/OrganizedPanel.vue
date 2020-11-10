<template>
  <div class="organize">
    <el-tabs v-model="activeName" class="custom">
      <el-tab-pane label="资源" name="resources">
        <el-scrollbar style="height:95vh;">
          <table rules="none" cellspacing=0 >
            <tr class="item" @click="handleResourceClick(headOptions[0])"><i :class="headOptions[0].icon"></i><td>全部</td><td /></tr>
            <tr class="item" @click="handleResourceClick(headOptions[1])"><i :class="headOptions[1].icon"></i><td>未分类</td><td>{{headOptions[1].value}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[2])"><i :class="headOptions[2].icon"></i><td>未标签</td><td>{{headOptions[2].value}}</td></tr>
            <tr class="item" @click="handleResourceClick(headOptions[3])"><i :class="headOptions[3].icon"></i><td>标签管理</td><td></td></tr>
          </table>
          <!-- <el-row type="flex">
          <el-col :span="22"><fieldset class="hor-line"><legend class="inner">分类</legend></fieldset></el-col>
          <el-col :span="2"><button class="noselection" @click="onAddFolder()">+</button></el-col>
          </el-row> -->
          <TreePanel>
            <FolderTree :data="category"></FolderTree>
            <IconFolder icon="el-icon-folder" enableInput="true" v-if="newFolder" v-on:editFinish="editFinish" :label="newCategoryName"></IconFolder>
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
import Service from '@/components/utils/Service'
import FolderTree from '@/components/Control/FolderTree'
import IconFolder from '@/components/Control/IconFolder'
import TreePanel from '@/components/Panel/TreePanel'

export default {
  name: 'organized-panel',
  components: {
    FolderTree,
    IconFolder,
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
      category: [{label: 'test.jpg', type: 'jpg', id: 1}], // [{label: name, type: dir/jpg, children: []}]
      newCategoryName: ''
    }
  },
  // computed: {
  //   loadDirectory() {
  //     console.info('computed：', this.$store.EventBus.importDirectory)
  //     return this.$store.EventBus.importDirectory
  //   },
  //   categoryName() {
  //     return this.$store.getters.classesName
  //   },
  //   category() {
  //     console.info('classes', this.$store.getters.category)
  //     return this.$store.getters.category
  //   },
  //   tags() {
  //     console.info('1 comupted tags: ', this.$store.getters.tags)
  //     return this.$store.getters.tags
  //   }
  // },
  mounted() {
    bus.on(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, this.updateLoadingDirectories)
    bus.on(bus.EVENT_UPDATE_UNCATEGORY_IMAGES, this.updateUncategoryImages)
    this.$ipcRenderer.on(Service.ON_IMAGE_UPDATE, this.updateDisplayImageList)
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
    updateUntagFiles() {
      const untags = this.$kernel.getUnTagFiles()
      this.headOptions[2].value = untags.length
    },
    updateDisplayImageList(error, appendFiles) {
      if (error) console.log(error)
      console.info('recieve from worker message:', appendFiles)
      this.updateUntagFiles()
      // TODO: 可能更新频繁导致的卡顿
      const getCategory = function(categoryPath, children) {
        if (categoryPath.length === 0) return children
        for (let item of children) {
          if (item.label === categoryPath[0]) {
            if (item.children === undefined) {
              item.children = []
              return item.children
            } else {
              return getCategory(categoryPath.slice(1), item.children)
            }
          }
          if (item.children !== undefined) {
            return getCategory(categoryPath, parent, item.children)
          }
        }
        return undefined
      }

      for (let item of appendFiles) {
        if (item.category === undefined || item.category.length === 0) {
          this.category.push({label: item.filename, id: item.id, type: item.type})
        } else {
          for (let cate of item.category) {
            const catePath = cate.split('/')
            let location = getCategory(catePath, this.category)
            if (location === undefined) { // 分类不存在
              let children = []
              let root = children
              for (let c of catePath) {
                children.push({label: c, type: 'clz', children: []})
                children = children.children
              }
              children.push({label: item.filename, id: item.id, type: item.type})
              this.category.children.push(root)
            } else { // 找到了对应的分类
              location.push({label: item.filename, id: item.id, type: item.type})
            }
          }
        }
      }
    },
    init() {
      // this.directoryData = await this.$ipcRenderer.get(Service.GET_IMAGES_DIRECTORY)
      // console.info('----', this.directoryData)
      // const folders = await this.$ipcRenderer.get(Service.GET_ALL_CATEGORY)
      // // console.info('get category', folders)
      this.updateUntagFiles()
      // const untagImages = await this.$ipcRenderer.get(Service.GET_UNTAG_IMAGES)
      // this.headOptions[2].value = untagImages.length
      // const allTags = await this.$ipcRenderer.get(Service.GET_ALL_TAGS_WITH_IMAGES)
      // console.info('all tag', allTags)
      // this.$store.dispatch('setCategory', folders)
      // this.$store.dispatch('setTags', allTags)
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
    },
    editFinish() {
      this.newFolder = false
      this.newCategoryName = ''
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
  background-color: rgb(9, 143, 231);
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
  background-color:rgb(22, 149, 233);
  -webkit-user-select: none;
}
.item {
  font-size: 14px;
}

table {
  width: 100%;
}

</style>