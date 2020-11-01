<template>
  <div class="tree">
    <PopMenu :list="menus" :underline="true" @ecmcb="onSelectMenu"></PopMenu>
    <div v-for="(item, idx) of data" :key="idx"  @contextmenu="onPopMenu($event, $root, parent, idx)">
      <!-- {{item}} -->
      <div >
        <!-- <span v-if="item.type && item.type!='clz'" class="img-name" :id="item.id">{{item.label}}</span> -->
        <i class="el-icon-caret-right" v-if="item.children && !(expandTree[idx])" @click="onExpand(idx)"></i>
        <i class="el-icon-caret-bottom" v-if="item.children  && (expandTree[idx])" @click="onRetract(idx)"></i>
        <span class="el-icon-caret-right caret-hidden" v-if="item.type==='clz' && !item.children"></span>
        <IconFolder v-if="!item.type || item.type==='clz'" :icon="item.icon?item.icon:'el-icon-folder'" :label="item.label" :parent="chain"></IconFolder>
        <div v-if="item.children && item.children.length > 0 && (expandTree[idx])" class="children">
          <FolderTree :data="item.children" :parent="(parent===undefined ? item.label : parent + '/' +item.label)"></FolderTree>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import IconFolder from './IconFolder'
import PopMenu from '@/components/Menu/PopMenu'
import Service from '@/components/utils/Service'
import bus from '@/components/utils/Bus'

export default {
  name: 'FolderTree',
  components: {
    IconFolder, PopMenu
  },
  data() {
    let expandTree = []
    if (this.data) {
      for (let idx = 0; idx < this.data.length; ++idx) {
        expandTree.push(false)
      }
    }
    // console.info('folder length:', this.data.length)
    return {
      expandTree: expandTree,
      menus: [
        // {text: '添加子类', cb: this.onAddClass},
        {text: '重命名', cb: this.onChangeName},
        {text: '删除', cb: this.onDeleteItem}
      ],
      selection: null
    }
  },
  props: {
    data: Array,
    parent: String
  },
  methods: {
    onExpand: function(idx) {
      // console.info(idx)
      this.$set(this.expandTree, idx, true)
      // this.expandTree[idx] = true
    },
    onRetract: function(idx) {
      this.$set(this.expandTree, idx, false)
      // this.expandTree[idx] = false
    },
    onPopMenu: function(event, root, parent, indx) {
      this.selection = event.toElement.innerText
      // console.info(this.parent, tag, root)
      console.info('pop menu:', this.selection)
      event.stopPropagation()
      event.preventDefault()
      root.$emit('easyAxis', {
        // tag: tag,
        parent: parent,
        index: indx,
        x: event.clientX,
        y: event.clientY
      })
    },
    onSelectMenu: function (indexList) {
      console.info(indexList)
    },
    onAddClass: function (name) {
      console.info(name)
    },
    onDeleteItem: function (name, parent, index) {
      const item = this.data[index]
      console.info(item)
      // 判断是否是展开节点,如果是展开节点,先获取所有子节点及叶子节点,删除叶子节点,然后删除子节点
      if (!item.children || item.children.length === 0) {
        // 删除文件
        if (item.type !== 'clz') {
          this.$ipcRenderer.send(Service.REMOVE_FILES, [item.id])
          bus.emit(bus.EVENT_REMOVE_FILES, [item.id])
        }
      }
      this.data.splice(index, 1)
    },
    onChangeName: function (newName, parent, index) {
      console.info(this.selection, newName, parent, index)
      // this.$ipcRenderer.send(Service.UPDATE_CATEGORY_NAME, {oldname: this.selection, newname: newName})
    },
    getChildren: function () {}
  }
}
</script>
<style scoped>
.children {
  padding: 0 0 0 1em;
  width: 100%;
}
.caret-hidden {
  visibility: hidden;
}
.img-name {
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
  display: block;
  cursor: default;
}
.img-name:active {
  background-color: dodgerblue;
}

</style>