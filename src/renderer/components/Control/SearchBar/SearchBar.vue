<template>
  <div class="input-with-select el-input el-input--mini el-input-group el-input-group--append">
    <!-- <select id="keywords" class="el-input__inner" multiple></select> -->
    <div class="search-group" >
      <div class="search-default" v-for="(item, i) in conditions" :key="i" >
        <SearchItem :item="item" @erase="onItemDelete"></SearchItem>
      </div>
      <SearchInput class="search-input" @addSearchItem="onAddSearchText"></SearchInput>
    </div>
    <div class="el-input-group__append">
      <button type="button" class="el-button el-button--default el-button--mini is-round" @click="onSearch()">
        <i class="el-icon-search"></i>
      </button>
    </div>
  </div>
</template>
<script>
import SearchItem from './SearchItem'
import SearchInput from './SearchInput'
import { mapState } from 'vuex'
import bus from '../../utils/Bus'
import {logger} from '@/../public/Logger'
import { SearchCondition, ConditionType, ConditionOperation, DefaultQueryName } from '@/common/SearchManager'

export default {
  name: 'search-bar',
  components: {SearchItem, SearchInput},
  data() {
    return {
      conditions: [],
      choices: null
    }
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_QUERY_BAR, this.onUpdateSearchBar)
  },
  methods: {
    onAddSearchText(value) {
      if (typeof value === 'string') {
        let condition = new SearchCondition()
        condition.type = ConditionType.String
        condition.keyword = value
        condition.name = DefaultQueryName.Keyword
        condition.operation = ConditionOperation.Add
        this.conditions.push(condition)
      } else {
        let keys = Object.keys(value)
        console.info('keys:', keys)
        for (let k of keys) {
          // clean this type of keywords
          for (let idx = this.conditions.length - 1; idx >= 0; --idx) {
            if (this.conditions[idx].type === k) {
              this.conditions.splice(idx, 1)
            }
          }
        }
        for (let k of keys) {
          for (let item of value[k]) {
            if (item === '*') continue
            let condition = new SearchCondition()
            condition.type = ConditionType.String
            condition.name = DefaultQueryName.Keyword
            condition.keyword = item
            condition.operation = ConditionOperation.Add
            console.info('add condition', condition)
            this.conditions.push({type: k, text: item})
          }
        }
      }
    },
    onUpdateSearchBar(value) {
      this.onAddSearchText(value)
    },
    onItemDelete(item) {
      for (let idx = this.conditions.length - 1; idx >= 0; --idx) {
        const condition = this.conditions[idx]
        if (condition.type === item.type && condition.text === item.text) {
          this.conditions.splice(idx, 1)
          bus.emit(bus.EVENT_UPDATE_QUERY_EXTERNAL_CONDITION, item)
          break
        }
      }
    },
    onSearch() {
      console.info('start search', this.conditions)
      this.$store.dispatch('query', this.conditions)
      this.$router.push({path: '/query', query: {name: '检索“' + this.keyword + '”', type: 'keyword'}})
    }
  }
}
</script>
<style scoped>
.search-default {
  position: relative;
  display: inline;
}
.search-group {
  display: inline-block;
  vertical-align: top;
  width: 100%;
  /* padding: 7.5px 7.5px 3.75px; */
  border: 1px solid black;
  border-top-left-radius: 2.5px;
  border-bottom-left-radius: 2.5px;
  overflow: hidden;
  background-color: #222933;
}
.search-input {
  display: inline;
  width: 180px;
  background-color: #222933;
  color: white;
  outline: none;
  border: none;
  height: 24px;
}
</style>