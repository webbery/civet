<template>
  <div class="placeholder">
    <div v-for="item in data" :key="item">
      <i class="el-icon-caret-right" v-if="item.children"></i>
      <span class="el-icon-caret-right caret-hidden" v-if="!item.children"></span>
      <IconFolder :icon="item.icon" :label="item.label" :parent="chain"></IconFolder>
      <div v-if="item.children" class="children">
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
  props: {
    data: Object,
    chain: String
  }
}
</script>
<style scoped>
.placeholder {
  margin: 0;
  /* border: 1px solid black; */
  /* padding: 0 0 0 0.5em; */
}
.children {
  padding: 0 0 0 1em;
}
.caret-hidden {
  visibility: hidden;
}
</style>