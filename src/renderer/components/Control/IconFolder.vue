<template>
  <span>
    <i :class="icon"></i>
    <span class="class-name" v-if="!enableInput" @dblclick="onEdit()" @contextmenu.prevent="onRightClick">{{label}}</span>
    <input v-if="enableInput" @blur="onSave()" v-model="folderName" ref="folderInput"/>
  </span>
</template>
<script>
import Service from '../utils/Service'

export default {
  name: 'icon-folder',
  props: {
    icon: { type: String },
    label: { type: String },
    parent: { type: String },
    enableInput: { type: Boolean, default: false }
  },
  data() {
    return {
      folderName: ''
    }
  },
  mounted() {
    if (this.enableInput) {
      this.$nextTick(function () {
        // console.info('#####')
        this.$refs.folderInput.focus()
      })
    }
  },
  methods: {
    onEdit() {
      // console.info('edit')
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
      this.$emit('editFinish')
      if (this.folderName.trim() === '') return
      console.info('chain:', this.parent)
      this.$ipcRenderer.send(Service.ADD_CATEGORY, this.folderName, this.parent)
      // 同时更新缓存
      this.$store.dispatch('addCategory', this.folderName, this.parent)
      this.label = this.folderName
    },
    onRightClick(event) {
      console.info('right menu click', event)
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
.class-name:hover {
  background-color:rgb(22, 149, 233);
}
.class-name {
  width: 100%;
  /* border: 2px solid brown ; */
}
</style>