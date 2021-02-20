<template>
  <span @dblclick="onDbClick">
      <input v-model="text" v-if="editable" @blur="onBlur"/>
      <span class="context"><slot></slot></span>
  </span>
</template>
<script>
export default {
  name: 'input-label',
  data() {
    return {
      editable: false,
      text: ''
    }
  },
  computed: {},
  methods: {
    onDbClick: () => {
      this.editable = true
      this.text = this.$slots.default[0].text
      this.$emit('dblclick')
    },
    onBlur: () => {
      this.editable = false
    }
  }
}
</script>
<style scoped>
.context {
  font-size: 12px;
}
</style>