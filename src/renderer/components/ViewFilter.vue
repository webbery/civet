<template>
  <div>
    <el-color-picker v-model="color" size="mini"></el-color-picker>
    <span class="custom">
    <el-select v-model="tags" @change="onTagSelectChanged" @click.native="onLoadTags" clearable placeholder="标签" size="mini">
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value">
    </el-option>
  </el-select>
  </span>
  <el-select v-model="value" clearable placeholder="尺寸" size="mini">
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value">
    </el-option>
  </el-select>
  </div>
</template>

<script>
import log from '@/../public/Logger'

export default {
  name: 'view-filter',
  data() {
    return {
      color: '#409EFF',
      tags: []
    }
  },
  methods: {
    onLoadTags() {
      this.tags = this.$store.getters.allTags
      log.info(this.tags)
    },
    onTagSelectChanged() {
      log.info('onTagSelectChanged')
    }
  }
}
</script>

<style scoped>
.custom .el-select {
  transform: translateY(-8px);
}
</style>