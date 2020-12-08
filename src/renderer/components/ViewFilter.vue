<template>
  <div>
    <el-color-picker v-model="color" size="mini"></el-color-picker>
    <span class="custom">
      <el-select v-model="fileType" @change="onTimeSelectChanged" clearable placeholder="类型" size="mini" multiple >
        <el-option
          v-for="(item, idx) in fileTypes"
          :key="idx"
          :label="item.label"
          :value="item.label"
        >
        </el-option>
      </el-select>
      <el-select v-model="timeRange" @change="onTimeSelectChanged" clearable placeholder="时间" size="mini">
        <el-option
          v-for="(item, idx) in timeRanges"
          :key="idx"
          :label="item.label"
          :value="item.label"
        >
        </el-option>
      </el-select>
      <el-dropdown trigger="click">
        <el-button size="mini">尺寸<i class="el-icon-arrow-down el-icon--right"></i></el-button>
        <el-dropdown-menu slot="dropdown">
          <RangeInput label="宽" firstPlaceholder="最小" lastPlaceholder="最大"></RangeInput>
          <RangeInput label="高" firstPlaceholder="最小" lastPlaceholder="最大"></RangeInput>
        </el-dropdown-menu>
      </el-dropdown>
      <el-dropdown trigger="click">
        <el-button size="mini">大小<i class="el-icon-arrow-down el-icon--right"></i></el-button>
        <el-dropdown-menu slot="dropdown">
          <RangeInput firstPlaceholder="最小" lastPlaceholder="最大" unit="Kb"></RangeInput>
        </el-dropdown-menu>
      </el-dropdown>
    </span>
  </div>
</template>

<script>
import log from '@/../public/Logger'
import RangeInput from './Control/RangeInput'

export default {
  name: 'view-filter',
  components: {
    RangeInput
  },
  data() {
    return {
      color: '#409EFF',
      tags: [],
      timeRange: '',
      timeRanges: [
        {label: '今日'}, {label: '昨日'}, {label: '最近7日'}, {label: '最近1月'}, {label: '最近3月'}, {label: '最近1年'}, {label: '自定义'}
      ],
      fileType: '',
      fileTypes: [
        {label: 'jpg'}, {label: 'bmp'}
      ],
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
    },
    onTimeSelectChanged(item) {
    }
  }
}
</script>

<style scoped>
.custom .el-select {
  transform: translateY(-8px);
}
.custom input{
  width: 100px;
}
.custom .el-select-dropdown {
  transform: translateY(-8px);
  font-size: 12px;
}
.custom .el-dropdown{
  transform: translateY(-8px);
}
</style>