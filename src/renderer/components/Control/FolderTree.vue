<template>
  <div @contextmenu="onPopMenu($event,$root)" class="tree">
    <PopMenu :list="menus" :underline="true" @ecmcb="onSelectMenu"></PopMenu>
    <!-- <ul id="mytable">
    <li data-depth="0" class="collapse level0">
        <span class="toggle collapse"></span><span>Item 1</span>
    </li>
    </ul> -->
    <div v-for="(item, idx) of data" :key="idx">
      <!-- {{item}} -->
      <span v-if="item.type && item.type!='clz'" class="img-name">{{item.label}}</span>
      <i class="el-icon-caret-right" v-if="item.children && !(expandTree[idx])" @click="onExpand(idx)"></i>
      <i class="el-icon-caret-bottom" v-if="item.children  && (expandTree[idx])" @click="onRetract(idx)"></i>
      <span class="el-icon-caret-right caret-hidden" v-if="(!item.type || item.type==='clz') && !item.children"></span>
      <IconFolder v-if="!item.type || item.type==='clz'" :icon="item.icon?item.icon:'el-icon-folder'" :label="item.label" :parent="chain"></IconFolder>
      <div v-if="item.children && item.children.length > 0 && (expandTree[idx])" class="children">
        <FolderTree :data="item.children" :parent="(parent===undefined ? item.label : parent + '/' +item.label)"></FolderTree>
      </div>
    </div>
  </div>
</template>
<script>
import IconFolder from './IconFolder'
import PopMenu from '@/components/Menu/PopMenu'
import Service from '@/components/utils/Service'

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
    onPopMenu: function(event, root, tag) {
      this.selection = event.toElement.innerText
      console.info(this.parent)
      console.info('pop menu:', this.selection)
      event.stopPropagation()
      event.preventDefault()
      root.$emit('easyAxis', {
        tag: tag,
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
    onDeleteItem: function (name) {
      let chain = this.selection
      if (this.parent !== undefined) {
        chain = this.parent + '/' + this.selection
      }
      console.info('delete', chain)
      // this.$ipcRenderer.send(Service.REMOVE_FILES, {})
    },
    onChangeName: function (newName) {
      console.info(this.selection, newName)
      this.$ipcRenderer.send(Service.UPDATE_CATEGORY_NAME, {oldname: this.selection, newname: newName})
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
.img-name:active {
  background-color: dodgerblue;
}

</style>