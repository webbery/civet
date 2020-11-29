<template>
  <div :class="{item: !isSelected, selected: isSelected}">
    <i :class="icon"></i>
    <span class="class-name" v-if="!enableInput" @dblclick="onEdit()" @contextmenu.prevent="onRightClick">{{label}}</span>
    <input v-if="enableInput" @blur="onSave()" v-model="folderName" ref="folderInput"/>
  </div>
</template>
<script>
export default {
  name: 'icon-folder',
  props: {
    icon: { type: String },
    label: { type: String },
    parent: { type: String },
    isSelected: {type: Boolean, default: false},
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
      this.$emit('onblur', this.folderName)
      if (this.folderName.trim() === '') return
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
.item {
  width: 100%;
  display: inline-block;
}
.item:hover {
  background-color:rgb(55, 80, 97);
}
input {
  display: inline;
}
.selected {
  width: 100%;
  display: inline-block;
  background-color:rgb(16, 125, 197);
}
</style>