<template>
  <input v-model="value" v-on:input="onInputChange" placeholder="请输入搜索内容, 以空格分隔">
</template>
<script>
export default {
  name: 'search-input',
  props: {
    value: ''
  },
  methods: {
    onInputChange(event) {
      if (event.data === ' ') {
        if (this.value.trim() === '') return
        this.$emit('addSearchItem', this.value.substr(0, this.value.length - 1))
        const self = this
        this.$nextTick(() => {
          self.value = ''
        })
      } else {
        this.$emit('keywordChanged', this.value)
      }
    }
  }
}
</script>
<style scoped>
.input {
  width: 100px;
  background-color: #222933;
  color: white;
}
</style>