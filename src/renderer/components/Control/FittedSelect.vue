<template>
    <div class="cv-select" :placeholder="attributes.placeholder" ref="resizeable" >
      <div class="cv-select-bar" @click="onClick">
        <div class="search-default" v-for="(item, i) in selections" :key="i" >
          <SearchItem :item="item" @erase="onItemDelete" :v-if="item.operation !== 1"></SearchItem>
        </div>
        <input type="text" readonly class="cv-input_inner" :value="attributes.placeholder" v-if="selections.length === 0" :size="attributes.placeholder.length - 1">
        <span class="cv-select-arraw" ><i :class="defaultArraw"></i></span>
      </div>
      <div class="el-select-dropdown el-popper is-multiple" :class="showOptions" style="min-width: 80px; transform-origin: center top; z-index: 2002;">
        <div class="cv-pop-arrow" ></div>
        <div class="el-scrollbar">
          <div class="el-select-dropdown__wrap el-scrollbar__wrap" style="margin-bottom: -17px; margin-right: -17px;">
            <ul class="el-scrollbar__view el-select-dropdown__list">
              <li class="cv-select-item"
                v-for="(item, idx) of attributes.options"
                :key="idx"
              >
                <el-checkbox v-model="checks[idx]" @change="onItemSelect(idx)">{{item}}</el-checkbox>
              </li>
            </ul>
          </div>
          <div class="el-scrollbar__bar is-horizontal"><div class="el-scrollbar__thumb" style="transform: translateX(0%);"></div>
        </div>
        <div class="el-scrollbar__bar is-vertical">
          <div class="el-scrollbar__thumb" style="transform: translateY(0%);"></div>
        </div>
        </div>
      </div>
    </div>
</template>
<script>
// import { events } from '../../common/RendererService'
import { SearchCondition, ConditionType, ConditionOperation, DefaultQueryName, Search } from '@/common/SearchManager'
import SearchItem from './SearchBar/SearchItem'
/**
 * fitted select is a control that display selection in one line
 */
export default {
  name: 'fitted-select',
  components: {SearchItem},
  props: {
    attributes: Object
  },
  data() {
    return {
      useMinWidth: true,
      defaultArraw: 'cv-caret-down',
      showOptions: 'cv-hide-enum',
      selections: [],
      checks: []
    }
  },
  mounted() {
    // pass true to make input use its initial width as min-width
  },
  methods: {
    onClick() {
      console.debug('click arraw')
      if (this.defaultArraw === 'cv-caret-down') { // default arraw down
        this.defaultArraw += ' rotate-up'
        this.showOptions = 'cv-pop-enum'
      } else {
        this.defaultArraw = this.defaultArraw.replace(' rotate-up', '')
        this.showOptions = 'cv-hide-enum'
      }
    },
    onItemDelete(item) {
      event.stopPropagation()
      console.debug('erase item:', item)
      for (let idx = this.selections.length - 1; idx >= 0; --idx) {
        if (this.selections[idx].keyword === item.keyword) {
          this.selections.splice(idx, 1)
          break
        }
      }
      for (let idx = this.attributes.options.length - 1; idx >= 0; --idx) {
        if (this.attributes.options[idx] === item.keyword) {
          this.checks[idx] = false
          break
        }
      }
    },
    onItemSelect(idx) {
      if (this.checks[idx]) {
        const condition = {
          type: ConditionType.String,
          keyword: this.attributes.options[idx],
          name: DefaultQueryName.Keyword,
          operation: ConditionOperation.Add
        }
        this.selections.push(condition)
      } else {
        for (let pos = this.selections.length - 1; pos >= 0; --pos) {
          if (this.selections[pos].keyword === this.attributes.options[idx]) {
            this.selections.splice(pos, 1)
            break
          }
        }
      }
    }
  }
}
</script>

<style scoped>
@import url('../../../../static/css/all.min.css');

.cv-select {
  display: inline-block;
  -webkit-box-direction: normal;
  position: relative;
  color: rgb(248, 241, 241);
}
.cv-select input {
  height: 24px;
  line-height: 24px;
  -webkit-appearance: none;
  background-color: #222933;
  border: none;
  color: #eee;
  display: inline-block;
  font-size: 12px;
  outline: none;
  padding: 0 15px;
  cursor: pointer;
}
.cv-select input:hover {
  border-color: #eee;
}
.cv-select input:focus {
  border-color: #00adff;
}
.cv-select-arraw {
  position: absolute;
  /* right: 1px; */
  pointer-events: none;
}
.cv-input_inner {
  padding-right: 30px;
  pointer-events: all;
  transition: border-color .2s cubic-bezier(.645, .045, .355, 1);
}
.cv-caret-down {
  display: inline-block;
  line-height: 20px;
  height: 28px;
  text-align: center;
  transform: rotate(0deg);
  transition: transform 0.2s;
}
.cv-caret-down::before {
  content: '\f078';
  display: flex;
  height: 100%;
  align-items: center;
  font-family: 'FontAwesome';
  font-style: normal;
  font-weight: normal;
  cursor: pointer;
  color: #eee;
}
.rotate-up {
  transform: rotate(-180deg);
  transition: transform 0.2s;
}
.cv-hide-enum {
  display: none;
}
.cv-pop-enum {
  display: block;
  top: 36px;
}
.cv-pop-arrow {
  left: 35px;
  width: 12px;
  top: -6px;
  border-top-width: 0;
  margin-right: 3px;
  background-color: transparent;
}
.cv-pop-arrow::after {
  top: -13px;
  margin-left: -6px;
  border-color: transparent;
  content: " ";
  border-width: 6px;
  left:50%;
  position: absolute;
  border-style: solid;
  border-bottom-color: #222933;
  margin: none;
}
.cv-select-item {
  list-style: none;
  font-size: 12px;
  padding: 0 20px;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #eee;
  height: 30px;
  line-height: 30px;
  box-sizing: border-box;
  cursor: pointer;
}
.cv-select-item:hover {
  background-color: #313846;
}
.cv-select-item span {
  position: absolute;
  pointer-events: none;
}
.search-default {
  position: relative;
  display: inline;
}
.cv-select-bar{
  display: inline-block;
  vertical-align: top;
  width: calc(100% + 16px);
  border: 1px solid black;
  border-top-left-radius: 2.5px;
  border-bottom-left-radius: 2.5px;
  overflow: hidden;
  background-color: #222933;
  border-radius: 4px;
}
</style>