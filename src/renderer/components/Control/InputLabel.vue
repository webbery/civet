<template>
  <span @dblclick="onDbClick">
      <el-input size="mini" v-model="text" v-if="editable" @blur="onBlur" ref="contextInput"/>
      <span v-if="!editable" class="context"><slot></slot></span>
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
  props: {
    fileid: 0
  },
  computed: {},
  methods: {
    onDbClick() {
      this.editable = true
      this.text = this.$slots.default[0].text
      this.$nextTick(() => {
        const $input = this.$refs.contextInput
        $input.focus()
        $input.select(0, $input.value.length)
      })
    },
    onBlur() {
      this.editable = false
      this.$emit('changed', this.fileid, this.text)
    }
  }
}
</script>
<style scoped>
/* .context {
  font-size: 12px;
} */
.cv-input{
  position:relative;
  left:0;
  right:0;
}
</style>