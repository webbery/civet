<template>
  <div style="display: flex; justify-content: center">
    <div v-for="(item, idx) in searchComponents" :key="idx" style="display: inline-block;">
      <MixComponent :type="item.type" :query="item.query" :attributes="item.attributes" @change="onConditionChanged"></MixComponent>
    </div>
    <!-- <span class="custom">
      {{searchComponents.length}}
    </span> -->
  </div>
</template>

<script>
import RangeInput from './Control/RangeInput'
import MixComponent from './Control/MixComponent'
import FittedSelect from './Control/FittedSelect'
import { debounce } from 'lodash'
import { IPCRendererResponse } from '@/../public/IPCMessage'
import bus from './utils/Bus'
import Vue from 'vue'

export default {
  name: 'view-filter',
  components: {
    RangeInput,
    FittedSelect,
    MixComponent
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
      searchComponents: [],
      testType: 'enum',
      attributes: {
        placeholder: '类型',
        options: ['jpg', 'png']}
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
      for (const param of params) {
        console.debug('onViewInit param:', param)
        switch (param.type) {
          case 'enum':
            Vue.set(this.searchComponents, this.searchComponents.length, {
              type: param.type,
              query: param.keyword,
              attributes: {
                placeholder: param.name,
                multiple: param.multiple,
                options: param.options
              }
            })
            break
          case 'color':
            Vue.set(this.searchComponents, this.searchComponents.length, {
              type: param.type,
              query: param.keyword,
              attributes: {
                color: param.color
              }
            })
            break
          default:
            console.warn(`unknow search condition ${param.type}`)
            break
        }
      }
      console.debug('components:', this.searchComponents.length)
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
    onConditionChanged(selections, name) {
      console.debug('search selections', selections)
      this.$store.dispatch('query', {selections, name})
    },
    // onTimeSelectChanged(keys) {
    //   let today = new Date(new Date().toLocaleDateString())
    //   // let yesterdy = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    //   let condition = new SearchCondition()
    //   condition.name = DefaultQueryName.AddedTime
    //   condition.comparation = DatetimeOperator.Greater
    //   condition.operation = ConditionOperation.Keep
    //   condition.type = ConditionType.Datetime
    //   switch (keys) {
    //     case 'today':
    //       condition.keyword = today
    //       // query = {addtime: {$gt: today}}
    //       break
    //     case 'yesterday':
    //       let yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
    //       yesterday.setHours(0, 0, 0, 0)
    //       condition.keyword = yesterday
    //       break
    //     case 'near7':
    //       let near7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    //       near7.setHours(0, 0, 0, 0)
    //       condition.keyword = near7
    //       // query = {addtime: {$gt: near7}}
    //       break
    //     case 'near30':
    //       let near30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    //       near30.setHours(0, 0, 0, 0)
    //       condition.keyword = near30
    //       // query = {addtime: {$gt: near30}}
    //       break
    //     case 'near90':
    //       let near90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    //       near90.setHours(0, 0, 0, 0)
    //       condition.keyword = near90
    //       // query = {addtime: {$gt: near90}}
    //       break
    //     case 'near365':
    //       let near365 = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
    //       near365.setHours(0, 0, 0, 0)
    //       condition.keyword = near365
    //       // query = {addtime: {$gt: near365}}
    //       break
    //     default:
    //       condition.keyword = '*'
    //       // query = {addtime: '*'}
    //       break
    //   }
    //   this.$store.dispatch('query', [condition])
    // },
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
    }
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