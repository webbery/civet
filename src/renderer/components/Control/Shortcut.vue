<template>
  <div class="_cv_basic-shortcut" @keydown="onKeyDown" @keyup="onKeyUp" tabindex="0" @click="onClick">
    <span v-for="(item, k) in currentShortcuts" :key="k">{{item}}</span>
  </div>
</template>
<script>
import Vue from 'vue'

export default {
  data() {
    return {
      currentShortcuts: ['None'],
      index: 0,
      total: 0
    }
  },
  props: {
    defaultShortcuts: String
  },
  mounted() {
    if (this.defaultShortcuts.length) {
      this.currentShortcuts = this.defaultShortcuts.split(' ')
    }
  },
  methods: {
    isAssistKey(key) {
      return (key === 'Control' || key === 'Shift' || key === 'Alt')
    },
    isCaptal(key) {
      return key === 'CapsLock'
    },
    localKey(key) {
      switch (key) {
        case 'Control': return 'Ctrl'
        case 'Command': return 'Cmd'
        case 'Alt': return 'Alt'
        case 'Option': return 'Opt'
        default: return key
      }
    },
    onKeyDown(event) {
      const key = this.localKey(event.key)
      if (this.index === 0) {
        this.currentShortcuts.splice(0, this.currentShortcuts.length - 1)
        this.currentShortcuts[this.index] = key
      } else {
        if (this.currentShortcuts.includes(key)) return
        if (this.index === this.currentShortcuts.length) {
          this.currentShortcuts.push(key)
        } else {
          Vue.set(this.currentShortcuts, this.index, key)
        }
      }
      this.index = this.currentShortcuts.length
      console.debug(`keydown[${this.index}]: ${key}`)
    },
    onKeyUp(event) {
      this.index = this.currentShortcuts.length - 1
      const key = this.localKey(event.key)
      if (key === this.currentShortcuts[0]) {
        this.index = 0
        this.$emit('changed', this.defaultShortcuts, this.currentShortcuts)
        this.defaultShortcuts = this.currentShortcuts.join(' ')
      }
      console.debug('press cnt', this.index)
    },
    onClick() {
      this.index = 0
    }
  }
}
</script>
<style scoped>
._cv_basic-shortcut {
display: inline;
outline: none;
}
._cv_basic-shortcut span {
  background-color: rgb(79 88 144);
  margin: 3px;
  padding: 2px;
  border-radius: 3px;
}
</style>
