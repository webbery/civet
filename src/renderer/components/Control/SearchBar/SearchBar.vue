<template>
  <div class="input-with-select el-input el-input--mini el-input-group el-input-group--append">
    <!-- <select id="keywords" class="el-input__inner" multiple></select> -->
    <div class="search-group" >
      <div class="search-default" v-for="(item, i) of conditions" :key="i" >
        <SearchItem :text="item"></SearchItem>
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
  },
  methods: {
    onAddSearchText(value) {
      console.info('add keyword', value)
      this.conditions.push(value)
    },
    onSearch() {}
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
  background-color: #222933;
  /* padding: 7.5px 7.5px 3.75px; */
  border: 1px solid black;
  border-top-left-radius: 2.5px;
  border-bottom-left-radius: 2.5px;
  overflow: hidden;
}
.search-input {
  display: inline;
  width: 180px;
}
</style>