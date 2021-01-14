<template>
  <div class="tree" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" draggable="true" @drop="dropFiles($event)" @dragover.prevent>
    <PopMenu :list="menus" :underline="true" @ecmcb="onSelectMenu" tag="tree"></PopMenu>
    <div v-for="(item, idx) of data" :key="idx"  @contextmenu="onPopMenu($event, $root, parent, idx)" @click="onItemClick($event, idx, item)"
      @dragend="dragEnd($event)" @dragstart="dragStart($event)" draggable="true">
      <!-- {{item}} -->
        <IconFolder :expand="expandTree[idx]" :icon="item.icon?item.icon:'el-icon-goods'" 
          :isSelected="selections[idx]" :data="item" :parent="(item.type==='clz'? parent + '/' + item.name : parent)" :level="level">
        </IconFolder>
        <div v-if="item.hasChild && (expandTree[idx])" class="children">
          <FolderTree :data="item.children" :parent="(parent===undefined ? item.name : parent + '/' +item.name)"
            :level="(parent===undefined ? 0 : level + 1)"
            @onChildClick="onChildClick"
          ></FolderTree>
        </div>
        <div v-if="enableClassEditor[idx]">
          <IconFolder class="children"
            :enableInput="true"
            :label="newCategoryName"
            @onblur="onBlur">
          </IconFolder>
        </div>
    </div>
  </div>
</template>
<script>
import IconFolder from './IconFolder'
import PopMenu from '@/components/Menu/PopMenu'
import bus from '@/components/utils/Bus'
import JString from '@/../public/String'

export default {
  name: 'FolderTree',
  components: {
    IconFolder, PopMenu
  },
  data() {
    let expandTree = []
    let selections = []
    let enableClassEditor = []
    if (this.data) {
      for (let idx = 0; idx < this.data.length; ++idx) {
        expandTree.push(false)
        selections.push(false)
        enableClassEditor.push(false)
      }
    }
    // console.info('folder tree:', this.data)
    return {
      newCategoryName: '',
      enableClassEditor: enableClassEditor,
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
    parent: String,
    level: Number
  },
  mounted() {
    bus.on(bus.EVENT_REMOVE_ITEM, this.onRemoveItems)
  },
  methods: {
    onItemClick: function(e, idx, item) {
      console.info(idx, this.expandTree[idx], item)
      // if (idx === this.lastSelections[0]) return
      this.$set(this.expandTree, idx, !this.expandTree[idx])
      for (let indx of this.lastSelections) {
        this.selections[indx] = false
      }
      this.selections[idx] = true
      this.lastSelections = [idx]
      this.$emit('onChildClick', idx)
      e.stopPropagation()
    },
    onChildClick: function(idx) {
      for (let idx = 0; idx < this.data.length; ++idx) {
        this.$set(this.selections, idx, false)
      }
      this.$emit('onChildClick', -1)
    },
    onPopMenu: function(event, root, parent, indx) {
      this.selection = this.data[indx].name
      console.info(parent, 'pop menu:', this.selection, indx)
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
    onAddClass: function (name, parent, indx) {
      console.info('onAddClass', name, parent, indx, this.level)
      this.$set(this.enableClassEditor, indx, true)
      this.lastSelections = [indx]
      this.$set(this.expandTree, indx, true)
    },
    onBlur: function (clzName) {
      const index = this.lastSelections[0]
      this.$set(this.enableClassEditor, index, false)
      if (JString.isEmpty(clzName)) return
      // this.enableClassEditor, index, false)
      // this.$set(this.expandTree, index, false)
      // this.lastSelections = []
      // add child class
      let parent = (this.parent ? this.parent : this.selection)
      console.info('add class', index, 'parent:', parent)
      const className = parent + '/' + clzName
      this.$store.dispatch('addClass', [className])
    },
    onDeleteItem: function (name, parent, index) {
      const item = this.data[index]
      console.info(index, item)
      this.$store.dispatch('removeClass', [item.name])
      // 判断是否是展开节点,如果是展开节点,先获取所有子节点及叶子节点,删除叶子节点,然后删除子节点
      // if (!item.children || item.children.length === 0) {
      //   // 删除文件所属类别
      //   if (item.type !== 'clz') {
      //     this.$ipcRenderer.send(Service.REMOVE_FILES, [item.id])
      //     bus.emit(bus.EVENT_REMOVE_FILES, [item.id])
      //   }
      // }
      // this.data.splice(index, 1)
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
    },
    enableAddClass: function(enable) {
      this.enableClassEditor = enable
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