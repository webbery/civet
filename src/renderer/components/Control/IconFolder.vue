<template>
  <div :class="{item: !isSelected, selected: isSelected}" :level="level">
    <input v-if="enableInput" @blur="onSave()" v-model="folderName" ref="folderInput"/>
    <span v-if="!enableInput">
      <i class="el-icon-caret-right" v-if="data.count!=0 && !expand"></i>
      <i class="el-icon-caret-bottom" v-if="data.count!=0 && expand"></i>
      <i :class="data.icon"></i>
      <span :path="parent" @dblclick="onEdit()" @contextmenu.prevent="onRightClick" @click="onItemClick()">{{data.name}}</span>
      <span class="count">{{data.count?data.count:(data.children?data.children.length:0)}}</span>
    </span>
  </div>
</template>
<script>
export default {
  name: 'icon-folder',
  props: {
    data: {type: Object, default: {count: 0}},
    parent: {type: String},
    expand: {type: Boolean, default: false},
    level: {type: Number, default: 0},
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
    onItemClick() {
      console.info('iconFolder', this.isSelected)
    },
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
  font-size: 13px;
  background-color:rgb(16, 125, 197);
}
.count {
  position:absolute;
  right: 0;
}
/* [level=1] {
  left: 5px;
}
[level=2] {
  left: 5px;
} */
</style>