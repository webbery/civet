<template>
  <div>
    <div v-for="(item, idx) in data" :key="idx">
      <i class="el-icon-caret-right" v-if="item.children && !(expandTree[idx])" @click="onExpand(idx)"></i>
      <i class="el-icon-caret-bottom" v-if="item.children  && (expandTree[idx])" @click="onRetract(idx)"></i>
      <span class="el-icon-caret-right caret-hidden" v-if="!item.children"></span>
      <IconFolder :icon="item.icon" :label="item.label" :parent="chain"></IconFolder>
      <div v-if="item.children && (expandTree[idx])" class="children">
        <FolderTree :data="item.children" :chain="chain + '.' +item.label"></FolderTree>
      </div>
    </div>
  </div>
</template>
<script>
import IconFolder from './IconFolder'

export default {
  name: 'FolderTree',
  components: {
    IconFolder
  },
  data() {
    let expandTree = []
    for (let idx = 0; idx < this.data.length; ++idx) {
      expandTree.push(false)
    }
    // console.info('folder length:', this.data.length)
    return {
      expandTree: expandTree
    }
  },
  props: {
    data: Array,
    chain: String
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
    }
  }
}
</script>
<style scoped>
.children {
  padding: 0 0 0 1em;
}
.caret-hidden {
  visibility: hidden;
}
</style>