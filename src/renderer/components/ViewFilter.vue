<template>
  <div style="display: flex; justify-content: center">
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
      <FittedSelect></FittedSelect>
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
      <span v-for="(item, i) of extensions" :key="i">
        <span v-html="item.html"></span>
      </span>
    </span>
  </div>
</template>

<script>
import RangeInput from './Control/RangeInput'
import FittedSelect from './Control/FittedSelect'
import { debounce } from 'lodash'
import { IPCRendererResponse } from '@/../public/IPCMessage'
import bus from './utils/Bus'
import { Search,
  SearchCondition,
  ConditionOperation,
  DatetimeOperator,
  ColorOperator,
  ConditionType,
  DefaultQueryName
} from '@/common/SearchManager'

export default {
  name: 'view-filter',
  components: {
    RangeInput,
    FittedSelect
  },
  data() {
    // current datetime
    return {
      color: null,
      queryTypes: [],
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
      lastQuery: {},
      clazz: [],
      extensions: {},
      test: [],
      aaa: []
    }
  },
  created() {
    this.$ipcRenderer.on(IPCRendererResponse.ON_SEARCH_INIT_COMMAND, this.onViewInit)
  },
  beforeMount() {
    this.$ipcRenderer.on('Search', this.onViewUpdate)
    // this.$ipcRenderer.onViewUpdate('Search', this.onViewUpdate)
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_QUERY_EXTERNAL_CONDITION, this.onQueryConditionChanged)
  },
  methods: {
    onViewInit(params) {
      console.debug('recieved std.search command:', params)
    },
    onViewUpdate(id, classname, html) {
      this.$set(this.extensions, id, {html: html})
      // this.extensions[id] = {html: html}
    },
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
      let condition = new SearchCondition()
      condition.name = DefaultQueryName.AddedTime
      condition.comparation = DatetimeOperator.Greater
      condition.operation = ConditionOperation.Keep
      condition.type = ConditionType.Datetime
      switch (keys) {
        case 'today':
          condition.keyword = today
          // query = {addtime: {$gt: today}}
          break
        case 'yesterday':
          let yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
          yesterday.setHours(0, 0, 0, 0)
          condition.keyword = yesterday
          break
        case 'near7':
          let near7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          near7.setHours(0, 0, 0, 0)
          condition.keyword = near7
          // query = {addtime: {$gt: near7}}
          break
        case 'near30':
          let near30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          near30.setHours(0, 0, 0, 0)
          condition.keyword = near30
          // query = {addtime: {$gt: near30}}
          break
        case 'near90':
          let near90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          near90.setHours(0, 0, 0, 0)
          condition.keyword = near90
          // query = {addtime: {$gt: near90}}
          break
        case 'near365':
          let near365 = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
          near365.setHours(0, 0, 0, 0)
          condition.keyword = near365
          // query = {addtime: {$gt: near365}}
          break
        default:
          condition.keyword = '*'
          // query = {addtime: '*'}
          break
      }
      this.$store.dispatch('query', [condition])
    },
    onFileTypeChanged(keys) {
      let query = []
      if (!this.lastQuery[DefaultQueryName.Type]) this.lastQuery[DefaultQueryName.Type] = []
      const generateCondition = function(key, op) {
        let condition = new SearchCondition()
        condition.operation = op
        condition.keyword = key
        condition.name = DefaultQueryName.Type
        condition.type = ConditionType.ContentType
        return condition
      }
      for (let item of this.lastQuery[DefaultQueryName.Type]) { // find removed item
        if (keys.includes(item)) continue
        query.push(generateCondition(item, ConditionOperation.Remove))
      }
      for (let key of keys) {
        if (this.lastQuery[DefaultQueryName.Type].includes(key)) {
          query.push(generateCondition(key, ConditionOperation.Keep))
        } else {
          query.push(generateCondition(key, ConditionOperation.Add))
        }
      }
      this.lastQuery[DefaultQueryName.Type] = keys
      this.$store.dispatch('query', query)
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
    onColorChanged: debounce(async function (color) {
      let condition = new SearchCondition()
      condition.name = DefaultQueryName.Color
      if (!color) {
        condition.operation = ConditionOperation.Remove
        condition.keyword = this.color
        this.$store.dispatch('query', [condition])
      } else {
        const tinyColor = require('tinycolor2')
        const hex = tinyColor(color).toHexString()
        condition.keyword = hex
        condition.operation = ConditionOperation.Add
        condition.type = ConditionType.Color
        this.$store.dispatch('query', [condition])
        this.color = color
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