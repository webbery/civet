<template>
  <div class="organize">
    <el-tabs v-model="activeName" class="custom" tab-position="top" >
      <el-tab-pane name="resources"><span slot="label"><i class="el-icon-document"></i></span>
        <el-scrollbar style="height:95vh;">
          <table rules="none" cellspacing=0 >
            <tr @click="handleResourceClick(headOptions[0], 0)" :class="{selected: headOptions[0].isSelected, item: !headOptions[0].isSelected}"><td><i :class="headOptions[0].icon"></i>全部</td><td>{{allcount}}</td></tr>
            <tr @click="handleResourceClick(headOptions[1], 1)" :class="{selected: headOptions[1].isSelected, item: !headOptions[1].isSelected}"><td><i :class="headOptions[1].icon"></i>未分类</td><td>{{unclasses}}</td></tr>
            <tr @click="handleResourceClick(headOptions[2], 2)" :class="{selected: headOptions[2].isSelected, item: !headOptions[2].isSelected}"><td><i :class="headOptions[2].icon"></i>未标签</td><td>{{untags}}</td></tr>
            <tr @click="handleResourceClick(headOptions[3], 3)" :class="{selected: headOptions[3].isSelected, item: !headOptions[3].isSelected}"><td><i :class="headOptions[3].icon"></i>标签管理</td><td></td></tr>
          </table>
          <TreePanel :isActive="true" @addRootClass="addRootClass">
            <PopMenu :list="menus" :underline="false" @ecmcb="onSelectMenu" tag="classTree"></PopMenu>
            <VueTreeList
              @click="onClickNode"
              @right-click="onRightClick"
              @change-name="onChangeName"
              @delete-node="onDelNode"
              @add-node="onAddNode"
              @drop="onDropNode"
              :model="category"
              default-tree-node-name=""
              default-leaf-node-name=""
              v-bind:default-expanded="false"
            >
              <template v-slot:leafNameDisplay="slotProps">
                <span>
                  {{ slotProps.model.name }}
                </span>
              </template>
            </VueTreeList>
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
import { TreeNode } from '../Control/Tree'
import PopMenu from '@/components/Menu/PopMenu'
import TreePanel from '@/components/Panel/TreePanel'
import { mapState } from 'vuex'
import VueTreeList from '@/components/Control/VueTreeList'
import { isEmpty } from '../../../public/Utility'

export default {
  name: 'navigation-panel',
  components: {
    // FolderTree,
    PopMenu,
    VueTreeList,
    TreePanel
  },
  data() {
    return {
      activeName: 'resources',
      headOptions: [
        {
          label: '全部',
          name: 'all',
          icon: 'el-icon-menu',
          value: 0,
          isSelected: false
        },
        {
          label: '未分类',
          name: 'unclass',
          icon: 'el-icon-document',
          value: 0,
          isSelected: false
        },
        {
          label: '未标签',
          name: 'untag',
          icon: 'el-icon-news',
          value: 0,
          isSelected: false
        },
        {
          label: '标签管理',
          name: 'manageTag',
          icon: 'el-icon-tickets',
          isSelected: false
        }
      ],
      // data: new Tree([]),
      newCategoryName: '',
      // index: 0,
      menus: [
        {text: '导出到计算机', cb: this.onExportClasses},
        {text: '重命名', cb: this.onMenuChangeName},
        {text: '添加', cb: this.onAddClass},
        {text: '删除', cb: this.onDeleteClass}
      ]
    }
  },
  computed: mapState({
    category: state => state.Cache.classes,
    untags: state => state.Cache.untags,
    unclasses: state => state.Cache.unclasses,
    allcount: state => state.Cache.allCount
  }),
  mounted() {
    bus.on(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, this.updateLoadingDirectories)
    bus.on(bus.EVENT_UPDATE_UNCATEGORY_IMAGES, this.updateUncategoryImages)
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateUncategoryImages(updateValue) {
      this.headOptions[1].value += updateValue
    },
    addRootClass() {
      let name = ''
      // if (this.index !== 0) name = name + this.index
      // let root = new TreeNode({name: name, isLeaf: false})
      // if (!this.data.children) this.data.children = []
      // this.data.addChildren(root)
      // this.index += 1
      this.$store.dispatch('addClass', [name])
    },
    onAddNode(node, parent) {
      console.info('onAddNode', node)
      this.$store.dispatch('addClass', {parent, node})
    },
    onDelNode(node) {
      console.info('onDelNode', node)
      this.$store.dispatch('removeClass', node)
    },
    onClickNode(node) {
      console.info('onClickNode', node)
      if (isEmpty(node.name)) return
      let parentPath = ''
      let parent = node.parent
      while (parent) {
        if (parent.name === 'root') break
        parentPath += parent.name + '/'
        parent = parent.parent
      }
      const clsPath = parentPath + node.name
      this.$store.dispatch('getClassesAndFiles', clsPath)
    },
    onChangeName(params) {
      if (params.eventType === 'blur') {
        console.info('onChangeName', params)
        let newName = params.newName
        let oldName = params.oldName
        let sParent = ''
        let parent = params.parent
        while (parent.parent) {
          sParent = parent.name + '/' + sParent
          parent = parent.parent
        }
        this.$store.dispatch('changeClassName', {old: sParent + oldName, new: sParent + newName})
      }
    },
    onRightClick(params) {
      // console.info('right-click', params)
      const event = params.event
      const root = params.root
      root.$emit('easyAxis', {
        tag: 'classTree',
        index: {model: params.model, operator: {expand: params.expand, setEditable: params.setEditable}},
        x: event.clientX,
        y: event.clientY
      })
    },
    onDeleteClass(name, parent, data) {
      console.info(name, parent, data.model)
      this.$store.dispatch('removeClass', data.model)
    },
    onExportClasses(params) {},
    onAddClass(name, parent, data) {
      console.info('add node:', data)
      var node = new TreeNode({ name: '', isLeaf: false, editable: true })
      this.$store.dispatch('addClass', {parent: data.model, node})
      this.$nextTick(() => {
        data.operator.expand()
      })
    },
    onMenuChangeName(name, parent, data) {
      console.info(data)
      data.operator.setEditable()
    },
    onDropNode(params) {
      console.info('onDropNode', params)
    },
    onSelectMenu(indexList) {
      console.info('navi menu')
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
    resetSelected(idx) {
      for (let i = 0; i < 4; ++i) {
        if (i === idx) this.headOptions[i].isSelected = !this.headOptions[i].isSelected
        else this.headOptions[i].isSelected = false
      }
    },
    handleResourceClick(node, idx) {
      this.resetSelected(idx)
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
  background-color:rgb(55, 80, 97);
  -webkit-user-select: none;
}
.item {
  font-size: 14px;
}
table {
  width: 100%;
}

</style>