<template>
<div style="display: inline-block; padding: 0 4px;">
  <FittedSelect v-if="type==='enum'" :attributes="attributes" :query="query" @change="onSelectionChanged"></FittedSelect>
  <el-color-picker v-if="type==='color'" v-model="attributes.color" size="mini" style="" @active-change="onColorChanged" @change="onColorChanged"></el-color-picker>
</div>
</template>
<script>
import FittedSelect from './FittedSelect'
import { debounce } from 'lodash'
import { Search,
  SearchCondition,
  ConditionOperation,
  DatetimeOperator,
  ColorOperator,
  ConditionType,
  DefaultQueryName
} from '@/common/SearchManager'

export default {
  name: 'mix-component',
  components: {
    FittedSelect
  },
  props: {
    type: String,
    query: String,
    attributes: Object
  },
  data() {
    return {
    }
  },
  mounted() {},
  methods: {
    onSelectionChanged(selections, name) {
      this.$emit('change', selections, name)
    },
    onColorChanged: debounce(async function (color) {
      let condition = new SearchCondition()
      condition.name = DefaultQueryName.Color
      if (!color) {
        condition.operation = ConditionOperation.Remove
        condition.keyword = this.color
      } else {
        const tinyColor = require('tinycolor2')
        const hex = tinyColor(color).toHexString()
        condition.keyword = hex
        condition.operation = ConditionOperation.Add
        condition.type = ConditionType.Color
      }
      this.$emit('change', [condition], 'color')
    }, 100)
  }
}
</script>
