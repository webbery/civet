<template>
  <span >
    <i :class="icon"></i>
    <span class="text" v-if="!enableInput" @dblclick="onEdit()">{{label}}</span>
    <input v-if="enableInput" @blur="onSave()" v-model="folderName" ref="folderInput"/>
  </span>
</template>
<script>
import Service from './utils/Service'

export default {
  name: 'icon-folder',
  props: {
    icon: { type: String },
    label: { type: String },
    parent: { type: String }
  },
  data() {
    return {
      enableInput: false,
      folderName: ''
    }
  },
  methods: {
    onEdit() {
      console.info('edit')
      this.folderName = this.label
      // this.folderName = this.$slots['default'][0].text
      this.enableInput = true
      this.$nextTick(function () {
        // console.info('#####')
        // this.$refs.folderInput.focus()
        this.$refs.folderInput.select()
      })
    },
    onSave() {
      this.enableInput = false
      this.$ipcRenderer.send(Service.ADD_CATEGORY, this.folderName, this.parent)
      // 同时更新缓存
      this.$store.dispatch('addCategory', this.folderName, this.parent)
    }
  }
}
</script>
<style scoped>
span{
  -webkit-user-select: none;
}
input {
  display: inline;
}
</style>