<template>
  <div>
    <el-color-picker v-model="color" size="mini"></el-color-picker>
    <span class="custom">
    <el-select v-model="tags" @change="onTagSelectChanged" @click.native="onLoadTags" clearable placeholder="标签" size="mini">
    <el-option
      v-for="(item, idx) in tags"
      :key="idx"
      :label="item"
      :value="item">
    </el-option>
  </el-select>
  </span>
  <!-- <el-select v-model="clazz" clearable placeholder="分类" size="mini">
    <el-option
      v-for="(item, idx) in clazz"
      :key="idx"
      :label="item"
      :value="item">
    </el-option>
  </el-select> -->
  </div>
</template>

<script>
import log from '@/../public/Logger'

export default {
  name: 'view-filter',
  data() {
    return {
      color: '#409EFF',
      tags: [],
      clazz: []
    }
  },
  methods: {
    onLoadTags() {
      this.tags = this.$store.getters.allTags
      log.info(this.tags)
    },
    onTagSelectChanged(item) {
      this.$store.dispatch('siftByTag', item)
      this.$router.push({path: '/query', query: {name: '标签“' + item + '”', type: 'tag'}})
    }
  }
}
</script>

<style scoped>
.custom .el-select {
  transform: translateY(-8px);
}
</style>