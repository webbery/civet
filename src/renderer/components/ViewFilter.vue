<template>
  <div>
    <el-color-picker v-model="color" size="mini" style="" @active-change="onColorChanged" @change="onColorChanged"></el-color-picker>
    <span class="custom">
      <el-select v-model="query.type" @change="onFileTypeChanged" clearable placeholder=" 类型" size="mini" multiple>
        <el-option
          v-for="(item, idx) in conditions['type']"
          :key="idx"
          :label="item.label"
          :value="item.label"
        >
        </el-option>
      </el-select>
      <el-select v-model="timeRange" @change="onTimeSelectChanged" clearable placeholder=" 时间" size="mini">
        <el-option
          v-for="(item, idx) in timeRanges"
          :key="idx"
          :label="item.label"
          :value="item.key"
        >
        </el-option>
      </el-select>
      <!-- <MutiSelect v-model="aaa" :options="test" placeholder="1111" :multiple="true" :show-labels="true"></MutiSelect> -->
      <!-- <el-dropdown trigger="click">
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
      </el-dropdown> -->
    </span>
  </div>
</template>

<script>
import RangeInput from './Control/RangeInput'
import MutiSelect from './Control/Multiselect'
import { debounce } from 'lodash'
import bus from './utils/Bus'

export default {
  name: 'view-filter',
  components: {
    RangeInput,
    MutiSelect
  },
  data() {
    // current datetime
    return {
      color: null,
      tags: [],
      timeRange: '',
      timeRanges: [
        {label: '今日', key: 'today'},
        {label: '昨日', key: 'yesterday'},
        {label: '最近7日', key: 'near7'},
        {label: '最近30日', key: 'near30'},
        {label: '最近90日', key: 'near90'},
        {label: '最近365日', key: 'near365'}
      ],
      query: {
        type: []
      },
      conditions: {
        type: [
          {label: 'jpg'},
          {label: 'png'},
          {label: 'tif'},
          {label: 'bmp'}
        ]
      },
      clazz: []
    }
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_QUERY_EXTERNAL_CONDITION, this.onQueryConditionChanged)
  },
  methods: {
    onLoadTags() {
      this.tags = this.$store.getters.allTags
      // log.info(this.tags)
    },
    onTagSelectChanged(item) {
      this.$store.dispatch('siftByTag', item)
      this.$router.push({path: '/query', query: {name: '标签“' + item + '”', type: 'tag'}})
    },
    onTimeSelectChanged(keys) {
      let today = new Date(new Date().toLocaleDateString())
      // let yesterdy = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      let query
      switch (keys) {
        case 'today':
          query = {addtime: {$gt: today}}
          break
        case 'near7':
          let near7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          near7.setHours(0, 0, 0, 0)
          query = {addtime: {$gt: near7}}
          break
        case 'near30':
          let near30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          near30.setHours(0, 0, 0, 0)
          query = {addtime: {$gt: near30}}
          break
        case 'near90':
          let near90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          near90.setHours(0, 0, 0, 0)
          query = {addtime: {$gt: near90}}
          break
        case 'near365':
          let near365 = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
          near365.setHours(0, 0, 0, 0)
          query = {addtime: {$gt: near365}}
          break
        default:
          query = {addtime: '*'}
          break
      }
      this.$store.dispatch('query', query)
    },
    onFileTypeChanged(keys) {
      console.info('onFileTypeChanged', keys)
      if (keys.length === 0) {
        keys = ['*']
      }
      this.$store.dispatch('query', {type: keys})
      bus.emit(bus.EVENT_UPDATE_QUERY_BAR, {type: keys})
    },
    onQueryConditionChanged(value) {
      const filterType = value.type
      const query = this.query[filterType]
      if (!query) return
      for (let idx = 0, len = query.length; idx < len; ++idx) {
        if (query[idx] === value.text) {
          query.splice(idx, 1)
          break
        }
      }
    },
    onColorChanged: debounce(function (color) {
      this.color = color
      if (!color) {
        this.$store.dispatch('query', {color: '*'})
      } else {
        const tinyColor = require('tinycolor2')
        const hex = tinyColor(color).toHexString()
        this.$store.dispatch('query', {color: {$near: hex}})
      }
    }, 100)
  }
}
</script>

<style scoped>
.custom .el-select-dropdown {
  /* transform: translateY(-8px); */
  font-size: 12px;
}

</style>
<style lang="css" scoped>

</style>