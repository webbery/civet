<template>
<div style="display: inline-block;">
  <FittedSelect v-if="type==='enum'" :attributes="attributes"></FittedSelect>
</div>
</template>
<script>
import FittedSelect from './FittedSelect'

export default {
  name: 'mix-component',
  components: {
    FittedSelect
  },
  props: {
    type: String,
    attributes: Object
  },
  data() {
    return {
    }
  },
  mounted() {}
}
</script>
