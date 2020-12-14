<template v-slot:enableAddClass="enableEdit">
  <div class="tree" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" draggable="true" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="menus" :underline="true" @ecmcb="onSelectMenu" tag="tree"></PopMenu>
    <div v-for="(item, idx) of data" :key="idx"  @contextmenu="onPopMenu($event, $root, parent, idx)" @click="onItemClick($event, idx, item)"
      @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true">
      <!-- {{item}} -->
        <i class="el-icon-caret-right" v-if="item.children && !(expandTree[idx])"></i>
        <i class="el-icon-caret-bottom" v-if="item.children  && (expandTree[idx])"></i>
        <span class="el-icon-caret-right caret-hidden" v-if="item.type==='clz' && !item.children"></span>
        <!-- {{parent}} -->
        <IconFolder :icon="item.icon?item.icon:'el-icon-goods'" :isSelected="selections[idx]" :label="item.name" :parent="parent"></IconFolder>
        <div v-if="item.children && item.children.length > 0 && (expandTree[idx])" class="children">
          <FolderTree :data="item.children" :parent="(parent===undefined ? item.name : parent + '/' +item.name)"></FolderTree>
        </div>
    </div>
    <IconFolder icon="el-icon-folder" enableInput="true" v-if="enableAddClass" @onblur="onBlur" :label="newCategoryName"></IconFolder>
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
    let selections = []
    if (this.data) {
      for (let idx = 0; idx < this.data.length; ++idx) {
        expandTree.push(false)
        selections.push(false)
      }
    }
    console.info('folder tree:', this.data)
    return {
      newCategoryName: '',
      // enableAddClass: false,
      expandTree: expandTree,
      selections: selections,
      lastSelections: [],
      menus: [
        {text: '添加分类', cb: this.onAddClass},
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
  mounted() {
    bus.on(bus.EVENT_REMOVE_ITEM, this.onRemoveItems)
  },
  methods: {
    onItemClick: function(e, idx, item) {
      console.info(idx, this.expandTree[idx], item)
      this.$set(this.expandTree, idx, !this.expandTree[idx])
      for (let indx of this.lastSelections) {
        this.selections[indx] = false
      }
      this.selections[idx] = true
      this.lastSelections = [idx]
      e.stopPropagation()
    },
    onPopMenu: function(event, root, parent, indx) {
      this.selection = event.toElement.innerText
      // console.info(this.parent, tag, root)
      console.info('pop menu:', this.selection, indx)
      event.stopPropagation()
      event.preventDefault()
      root.$emit('easyAxis', {
        tag: 'tree',
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
      console.info(index, item)
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
    onRemoveItems: function (filesID) {
      console.info('onRemoveItems', filesID)
      for (let idx = 0; idx < this.data.length; ++idx) {
        for (let pos = 0; pos < filesID.length; ++pos) {
          if (this.data[idx].id === filesID[pos]) {
            this.data.splice(idx, 1)
            filesID.splice(pos, 1)
            if (filesID.length === 0) return
            break
          }
        }
      }
    },
    onChangeName: function (newName, parent, index) {
      console.info(this.selection, newName, parent, index)
      // this.$ipcRenderer.send(Service.UPDATE_CATEGORY_NAME, {oldname: this.selection, newname: newName})
    },
    getChildren: function () {},
    dropFiles: function(event) {
      event.preventDefault()
      let sourcesID = event.dataTransfer.getData('civet')
      console.info('dropFiles files to navigation:', sourcesID, 'target', event.target)
      const path = event.target.getAttribute('path')
      console.info('path', path)
      sourcesID = JSON.parse(sourcesID)
      let filesID = []
      for (let fid of sourcesID) {
        filesID.push(parseInt(fid))
      }
      this.$store.dispatch('addClass', {id: filesID, class: [path]})
    },
    dragEnd: function(event) {
      event.preventDefault()
      // const sourcesID = event.dataTransfer.getData('text/plain')
      // console.info('dragEnd files to navigation:', sourcesID)
    }
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
.tree {
  width: 100%;
  display: inline-block;
}
</style>